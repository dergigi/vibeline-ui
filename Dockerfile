FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Create a tmp VoiceMemos directory
# this is needed because next.js uses "ls" the files in the directory when building the app
RUN mkdir -p /app/VoiceMemos

# Build the Next.js application
RUN npm run build

# Remove the tmp VoiceMemos directory
RUN rm -rf /app/VoiceMemos

# Expose the port the app runs on
ENV PORT=555
EXPOSE 555

# Create a volume for the VoiceMemos directory
VOLUME [ "/app/VoiceMemos" ]

# Start the application
CMD ["npm", "start"]
