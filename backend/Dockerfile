FROM python:3.12-slim

# Prevent writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies (curl for healthchecks, gcc for some python packages if needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Ensure start script is executable
RUN chmod +x start.sh

# Expose port (Render sets PORT automatically, defaults to 8000)
EXPOSE 8000

# Start command
CMD ["./start.sh"]
