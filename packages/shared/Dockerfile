# Use official Node.js 20 image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port (Railway will override this)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
