import { Sound } from "./Sound";
interface SoundPosition {
    x: number;
    y: number;
    z: number;
}
/**
 * Like three.js' Vector3
 */
declare class SoundPosition {
    /**
     * Creates a new SoundPosition (litearly like THREE.Vector3)
     * in 3D space.
     * @param x the X coordinate
     * @param y the Y coordinate
     * @param z the Z coordinate
     */
    constructor(x?: number, y?: number, z?: number);
    /**
     * Makes a copy of this SoundPosition
     * @returns The new copy
     */
    copy(): SoundPosition;
    /**
     * Updates the specified sound's position to this SoundPosition
     * @param sound The sound to update
     */
    updateSoundPosition(sound: Sound): void;
}
export { SoundPosition };
