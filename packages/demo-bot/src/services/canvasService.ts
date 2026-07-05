import { createAnimafy } from 'animafy';

// Create our instance using the beginner-friendly factory.
// This sets up caching and the internal AssetManager automatically.
// We export this so commands can use it to create builders.
export const animafyClient = createAnimafy();

// For backward compatibility in our demo-bot commands
export const canvasService = {
    createBuilder: () => animafyClient.canvas()
};
