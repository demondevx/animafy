# Animafy Demo Bot

This is the official demonstration and integration testing bot for the **Animafy** canvas engine. It demonstrates the capabilities of Animafy in a production-like Discord environment.

## Features
- **Integration Tests**: Serves as a live integration test for all Animafy packages.
- **Showcase**: Generates complex, synchronized GIF animations and text/emoji rendering.
- **User Installable**: Can be installed directly to a user profile to be used anywhere on Discord.

## Installation

1. Ensure you have run `npm install` and `npm run build` in the root of the Animafy monorepo to compile the core packages.
2. Navigate to this directory: `cd packages/demo-bot`
3. Copy `.env.example` to `.env` and insert your Discord Bot Token and Client ID.

## Deployment

To deploy the slash commands to Discord:
```bash
npm run deploy
```

## Running the Bot

To start the bot locally or in production:
```bash
npm start
```
