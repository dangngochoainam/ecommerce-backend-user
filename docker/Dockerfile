FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app/node/src

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire project to the working directory
COPY . ./

# Build the NestJS application
# RUN npm run build

# Expose the port the app runs on
EXPOSE 9009 9229

# Define the command to run the application
CMD ["npm", "run", "start:dev"]
