FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Install a simple HTTP server
RUN npm install -g http-server

# Copy source files
COPY . .

# Build the library
RUN npm run build

# Expose port 8080
EXPOSE 8080

# Serve the example directory
CMD ["http-server", ".", "-p", "8080"]
