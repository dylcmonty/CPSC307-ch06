# Use a lightweight Node.js image
FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package manifests (for faster install)
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the Next.js project (outputs .next/)
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Start the server in production mode
CMD ["npm", "start"]
