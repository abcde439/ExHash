package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"time"
)

func main() {
	port := 8159
	addr := fmt.Sprintf(":%d", port)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	server := &http.Server{
		Addr:    addr,
		Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			path := r.URL.Path
			if path == "/" {
				path = "/index.html"
			}
			fullPath := filepath.Join(".", path)

			data, err := os.ReadFile(fullPath)
			if err != nil {
				http.NotFound(w, r)
				log.Printf("[404] Tidak ditemukan: %s\n", fullPath)
				return
			}

			// Set Content-Type berdasarkan ekstensi file
			switch filepath.Ext(fullPath) {
			case ".html":
				w.Header().Set("Content-Type", "text/html")
			case ".css":
				w.Header().Set("Content-Type", "text/css")
			case ".js":
				w.Header().Set("Content-Type", "application/javascript")
			case ".ico":
				w.Header().Set("Content-Type", "image/x-icon")
			default:
				w.Header().Set("Content-Type", "application/octet-stream")
			}

			w.WriteHeader(http.StatusOK)
			w.Write(data)
			log.Printf("[200] Melayani %s\n", fullPath)
		}),
	}

	// Jalankan server
	go func() {
		fmt.Printf("Server berjalan di http://localhost%s\n", addr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Kesalahan server: %v", err)
		}
	}()

	// Tunggu sampai Ctrl+C
	<-ctx.Done()
	stop()
	log.Println("Mematikan server...")

	// Graceful shutdown
	ctxShutdown, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := server.Shutdown(ctxShutdown); err != nil {
		log.Fatalf("Gagal shutdown: %v", err)
	}
	log.Println("Server dimatikan")
}