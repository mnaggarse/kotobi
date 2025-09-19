import * as FileSystem from "expo-file-system";
import * as SQLite from "expo-sqlite";

export interface Book {
  id?: number;
  title: string;
  cover: string;
  totalPages: number;
  pagesRead: number;
  status: "reading" | "completed" | "to-read";
  rating: number;
  createdAt: string;
  updatedAt: string;
}

interface DatabaseValidationResult {
  isValid: boolean;
  error?: string;
  books?: Book[];
  // Preserve the original parsed objects to access extended fields like coverData during import
  rawBooks?: any[];
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase;

  constructor() {
    this.db = SQLite.openDatabaseSync("kotobi.db");
    this.initDatabase();
  }

  private initDatabase() {
    try {
      this.db.execSync(
        `CREATE TABLE IF NOT EXISTS books (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          cover TEXT NOT NULL,
          totalPages INTEGER NOT NULL,
          pagesRead INTEGER DEFAULT 0,
          status TEXT DEFAULT 'to-read',
          rating INTEGER DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );`
      );
    } catch (error) {
      console.error("Error initializing database:", error);
    }
  }

  addBook(book: Omit<Book, "id" | "createdAt" | "updatedAt">): number {
    const now = new Date().toISOString();
    const result = this.db.runSync(
      "INSERT INTO books (title, cover, totalPages, pagesRead, status, rating, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        book.title,
        book.cover,
        book.totalPages,
        book.pagesRead,
        book.status,
        book.rating,
        now,
        now,
      ]
    );
    return result.lastInsertRowId || 0;
  }

  getBooks(): Book[] {
    const result = this.db.getAllSync(
      "SELECT * FROM books ORDER BY updatedAt DESC"
    );
    return result as Book[];
  }

  updateBookProgress(
    id: number,
    pagesRead: number,
    status?: Book["status"]
  ): void {
    const now = new Date().toISOString();
    if (status) {
      this.db.runSync(
        "UPDATE books SET pagesRead = ?, status = ?, updatedAt = ? WHERE id = ?",
        [pagesRead, status, now, id]
      );
    } else {
      this.db.runSync(
        "UPDATE books SET pagesRead = ?, updatedAt = ? WHERE id = ?",
        [pagesRead, now, id]
      );
    }
  }

  updateBookDetails(
    id: number,
    title: string,
    totalPages: number,
    status: Book["status"],
    cover: string,
    rating: number
  ): void {
    const now = new Date().toISOString();
    this.db.runSync(
      "UPDATE books SET title = ?, totalPages = ?, status = ?, cover = ?, rating = ?, updatedAt = ? WHERE id = ?",
      [title, totalPages, status, cover, rating, now, id]
    );
  }

  deleteBook(id: number): void {
    this.db.runSync("DELETE FROM books WHERE id = ?", [id]);
  }

  getStatistics(): {
    totalBooks: number;
    completedBooks: number;
    currentlyReading: number;
    totalPagesRead: number;
    totalPagesGoal: number;
  } {
    const result = this.db.getFirstSync(
      `SELECT 
        COUNT(*) as totalBooks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedBooks,
        SUM(CASE WHEN status = 'reading' THEN 1 ELSE 0 END) as currentlyReading,
        SUM(pagesRead) as totalPagesRead,
        SUM(totalPages) as totalPagesGoal
      FROM books`
    ) as any;

    return {
      totalBooks: result?.totalBooks || 0,
      completedBooks: result?.completedBooks || 0,
      currentlyReading: result?.currentlyReading || 0,
      totalPagesRead: result?.totalPagesRead || 0,
      totalPagesGoal: result?.totalPagesGoal || 0,
    };
  }

  resetData(): void {
    this.db.runSync("DELETE FROM books");
  }

  async exportData(): Promise<string> {
    try {
      const books = this.getBooks();
      const statistics = this.getStatistics();

      // Embed cover images as Base64 so exports are self-contained
      const booksWithEmbeddedCovers = await Promise.all(
        books.map(async (book) => {
          let coverData: { base64: string; ext: string } | null = null;
          try {
            // Only attempt to embed if the cover is a local file path
            const isFileUri =
              typeof book.cover === "string" &&
              (book.cover.startsWith("file://") ||
                book.cover.startsWith(FileSystem.documentDirectory || ""));
            if (isFileUri) {
              const info = await FileSystem.getInfoAsync(book.cover);
              if (info.exists && info.isDirectory === false) {
                const base64 = await FileSystem.readAsStringAsync(book.cover, {
                  encoding: FileSystem.EncodingType.Base64,
                });
                const extFromPath = book.cover.includes(".")
                  ? book.cover.split(".").pop() || "jpg"
                  : "jpg";
                coverData = { base64, ext: extFromPath };
              }
            }
          } catch (e) {
            // If we fail to read/encode the cover, continue without embedding
            console.warn("Failed to embed cover for export:", e);
          }
          return { ...book, coverData };
        })
      );

      const exportData = {
        // Bump version to indicate embedded cover support
        version: "1.1",
        exportedAt: new Date().toISOString(),
        books: booksWithEmbeddedCovers,
        statistics,
      };

      const jsonString = JSON.stringify(exportData, null, 2);

      // Create formatted date string with local time (hours, minutes, seconds)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");

      const dateString = `${day}-${month}-${year}_${hours}-${minutes}-${seconds}`;

      const fileName = `kotobi_backup_${dateString}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, jsonString);
      return fileUri;
    } catch (error) {
      console.error("Error exporting data:", error);
      throw new Error("فشل في تصدير البيانات");
    }
  }

  validateImportFile(jsonData: string): DatabaseValidationResult {
    try {
      const data = JSON.parse(jsonData);

      // Check if it's a valid export file
      if (!data.version || !data.books || !Array.isArray(data.books)) {
        return {
          isValid: false,
          error:
            "تنسيق ملف غير صحيح. يرجى اختيار ملف تصدير صحيح لتتبع القراءة.",
        };
      }

      // Validate each book (core fields). Extra fields like coverData are allowed and ignored here
      const validBooks: Book[] = [];
      for (const book of data.books) {
        if (!this.isValidBook(book)) {
          return {
            isValid: false,
            error: "بيانات كتاب غير صحيحة في الملف المستورد.",
          };
        }
        validBooks.push(book);
      }

      return {
        isValid: true,
        books: validBooks,
        rawBooks: data.books,
      };
    } catch (error) {
      return {
        isValid: false,
        error: "تنسيق JSON غير صحيح. يرجى اختيار ملف تصدير صحيح.",
      };
    }
  }

  async importData(jsonData: string): Promise<void> {
    const validation = this.validateImportFile(jsonData);

    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    try {
      // Clear existing data
      this.resetData();

      // Import new data
      if (validation.books && validation.books.length > 0) {
        const rawBooks = validation.rawBooks || validation.books;
        // Ensure covers directory exists under the app's document directory
        const coversDir = `${FileSystem.documentDirectory}covers/`;
        try {
          const dirInfo = await FileSystem.getInfoAsync(coversDir);
          if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(coversDir, {
              intermediates: true,
            });
          }
        } catch (e) {
          console.warn("Failed to ensure covers directory:", e);
        }

        for (let i = 0; i < validation.books.length; i++) {
          const book = validation.books[i];
          const rawBook: any = rawBooks[i] || {};

          let finalCoverPath = book.cover;
          // If embedded coverData exists, restore it to persistent storage and use that path
          if (
            rawBook &&
            rawBook.coverData &&
            typeof rawBook.coverData.base64 === "string" &&
            rawBook.coverData.base64.length > 0
          ) {
            const ext =
              typeof rawBook.coverData.ext === "string" &&
              rawBook.coverData.ext.length > 0
                ? rawBook.coverData.ext.replace(/[^a-zA-Z0-9]/g, "")
                : "jpg";
            const fileName = `cover_${Date.now()}_${i}.${ext}`;
            const fileUri = `${coversDir}${fileName}`;
            try {
              await FileSystem.writeAsStringAsync(
                fileUri,
                rawBook.coverData.base64,
                {
                  encoding: FileSystem.EncodingType.Base64,
                }
              );
              finalCoverPath = fileUri;
            } catch (e) {
              console.warn(
                "Failed to restore embedded cover; falling back to original cover path:",
                e
              );
            }
          }

          this.addBook({
            title: book.title,
            cover: finalCoverPath,
            totalPages: book.totalPages,
            pagesRead: book.pagesRead,
            status: book.status,
            rating: book.rating,
          });
        }
      }
    } catch (error) {
      console.error("Error importing data:", error);
      throw new Error("فشل في استيراد البيانات");
    }
  }

  private isValidBook(book: any): book is Book {
    return (
      typeof book.title === "string" &&
      typeof book.cover === "string" &&
      typeof book.totalPages === "number" &&
      book.totalPages > 0 &&
      typeof book.pagesRead === "number" &&
      book.pagesRead >= 0 &&
      book.pagesRead <= book.totalPages &&
      ["reading", "completed", "to-read"].includes(book.status) &&
      typeof book.createdAt === "string" &&
      typeof book.updatedAt === "string"
    );
  }
}

export const database = new DatabaseService();
