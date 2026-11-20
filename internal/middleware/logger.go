package middleware

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// Logger is a structured request logger middleware.
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		method := c.Request.Method

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()

		gin.DefaultWriter.Write([]byte(
			"[" + start.Format("2006-01-02T15:04:05Z07:00") + "] " +
				method + " " + path + " " +
				"status=" + strconv.Itoa(status) + " " +
				"latency=" + latency.String() + "\n",
		))
	}
}
