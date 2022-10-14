import { SoundPosition } from "./SoundPosition";
export declare type SoundSource = string | ArrayBuffer | AudioBuffer;
export declare type SoundConfig = {
    src: SoundSource;
    volume: number;
    pitch: number;
    pan: number;
    loop: boolean;
};
interface Sound {
    source: AudioBufferSourceNode | null;
    gain: GainNode | null;
    panner: PannerNode | null;
    steroPanner: StereoPannerNode | null;
    nodes: Array<AudioNode>;
    context: AudioContext;
    _config: SoundConfig;
    buffer: AudioBuffer | null;
    onload: Function | void | null;
    onended: Function | void | null;
    saveOffset: number;
}
declare class Sound {
    private _pos;
    private _samples;
    private _connectedNodes;
    private _hasPlayedYet;
    /**
     * Creates a primitive Sound interface
     * @param src - Either a String, AudioBuffer, or a ArrayBuffer
     */
    constructor(src: SoundSource);
    get samples(): number[][];
    /**
     * Returns the current source thing of the sound.
     */
    get src(): SoundSource;
    set src(src: SoundSource);
    /**
     * Returns the 3D Space of the Sound.
     */
    get pos(): SoundPosition;
    set pos(p: SoundPosition);
    get volume(): number;
    set volume(v: number);
    get currentTime(): number;
    get pitch(): number;
    /**
     * Returns the duration in seconds of the Sound
     *
     * (NOTE: when you change pitch or speed this value
     * won't change. you might need to do math to get the
     * duration with pitch.)
     *
     * If the Sound hasn't loaded fully yet
     * you will get 0
     */
    get duration(): number;
    /**
     * Returns the number of channels in the Sound
     *
     * If the Sound hasn't loaded fully returns 0
     */
    get numOfChannels(): number;
    /**
     * Returns the sample rate of the Sound
     *
     * If the Sound hasn't loaded fully returns 0
     */
    get sampleRate(): number;
    set pitch(p: number);
    /**
     * Returns the Stero Pan of the Sound.
     */
    get pan(): number;
    set pan(pan: number);
    /**
     * Returns wheather or not the Sound is looping.
     */
    get loop(): boolean;
    set loop(loop: boolean);
    /**
     * Configures the nodes, This is called by the getters and setters of the
     * Sound, This configures the MAIN nodes on the fly.
     *
     * You can use the _config property to change different things on the sound
     * and call configureNodes whenenver you would like your changes to be added to
     * the Sound. (wheather playing or not.)
     */
    configureNodes(): void;
    private createNodes;
    /**
     * Unlinks all of the **currently** connected nodes that are connected to the
     * AudioContext's destination.
     */
    unlinkNodes(): void;
    /**
     * Links **all** of the nodes together
     *
     * *(including the ones the developer specified)*
     */
    linkNodes(): void;
    /**
     * Adds the specified node at the front.
     *
     * *(the last effect for the sound to
     * go through before reaching the main effects)*
     *
     * @param node The node to add
     */
    pushNode(node: AudioNode): void;
    /**
     * Removes a node from the stack
     * If no node is provided it will pop the first effect from the stack.
     * @param node The node to remove from the node stack (OPTIONAL)
     * @returns The AudioNode or null
     */
    popNode(node?: AudioNode): AudioNode | null;
    private getSoundBuffer;
    private makeSourceNode;
    /**
     * Plays the Sound
     *
     * If any of the parameters below are specified they will be put into
     * the AudioSourceNode's start function.
     * @param when When to start playing the sound (OPTIONAL)
     * @param offset The offset (OPTIONAL)
     * @param duration The duration to play for (OPTIONAL)
     */
    play(when?: number, offset?: number, duration?: number): void;
    /**
     * Pauses the sound and saves the time.
     */
    pause(): void;
    /**
     * Fully stops the sound and sets the pauseOffset property to zero.
     */
    stop(): void;
    /**
     * Makes a copy of this sound and returns it.
     * @returns The copy of this sound
     */
    copy(): Sound;
}
export { Sound };
