FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Build the Next.js application
RUN npm run build

# Expose the port the app runs on
EXPOSE ${PORT:-555}

# Create a volume for the VoiceMemos directory
VOLUME [ "/app/VoiceMemos" ]

# Start the application
CMD ["npm", "start"]
