# Start from lightweight Python
FROM python:3.11-slim

WORKDIR /app

# Install only what's needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install with optimizations
COPY requirements.txt .

# Install minimal dependencies only
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
      fastapi==0.104.1 \
      uvicorn==0.24.0 \
      supabase==2.5.0 \
      openai==1.3.7 \
      pypdf==3.17.1 \
      python-docx==1.1.0 \
      requests==2.31.0 \
      python-multipart==0.0.6 \
      python-dotenv==1.0.0 \
      psycopg2-binary==2.9.10 \
      pydantic-settings==2.0.3 && \
    rm -rf ~/.cache/pip

# Copy source
COPY . .

# Create non-root user
RUN useradd -m appuser && chown -R appuser /app
USER appuser

EXPOSE 8000

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}

