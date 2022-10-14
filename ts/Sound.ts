import { SoundPosition } from "./SoundPosition";

function isDirectURL (str:string) {
    return /http(s?):\/\//g.test(str);
}

export type SoundSource = string | ArrayBuffer | AudioBuffer;

export type SoundConfig = { src: SoundSource, volume: number, pitch: number, pan: number, loop: boolean };

interface Sound {
    source: AudioBufferSourceNode|null,
    gain: GainNode|null,
    panner: PannerNode|null,
    steroPanner: StereoPannerNode|null,
    nodes: Array<AudioNode>,
    context: AudioContext,
    _config:SoundConfig,
    buffer: AudioBuffer|null,
    onload: Function|void|null,
    onended: Function|void|null,
    saveOffset: number
}

class Sound {
    private _pos:SoundPosition;
    private _samples: Array<Array<number>>;
    private _connectedNodes: Array<AudioNode>;
    private _hasPlayedYet:boolean;

    /**
     * Creates a primitive Sound interface
     * @param src - Either a String, AudioBuffer, or a ArrayBuffer
     */

    constructor (src:SoundSource) {
        this._config = { src, volume: 1, pitch: 1, pan: 0, loop: false };

        this.context = new AudioContext();

        // Nodes:
        this.gain = null;
        this.panner = null;
        this.source = null;
        this.steroPanner = null;
        this.nodes = [];
        this.buffer = null;
        this._samples = [];
        this._connectedNodes = [];
        if (!this.onended) this.onended = null;
        if (!this.onload) this.onload = null;
        this._hasPlayedYet = false;
        this.saveOffset = 0;

        // 3D Space:
        this._pos = new SoundPosition();

        // Creating Main Nodes:
        this.createNodes();
        this.makeSourceNode();
    }

    // Sound sample getting:

    get samples () {
        if (!this.buffer || !this.source)
            throw new Error("The Sound hasn't finished loading yet!");
        if (this._samples.length == 0) {
            var chanls = this.buffer.numberOfChannels,
                result:Array<Array<number>> = [];
            for (let i = 0; i < chanls; i++) {
                result.push(Array.prototype.slice.call(this.buffer.getChannelData(i)));
            }
            this._samples = result;
            return result;
        } else {
            return this._samples;
        }
    }

    // Sound getters and setters:

    /**
     * Returns the current source thing of the sound.
     */

    get src () {
        return this._config.src;
    }

    set src (src:SoundSource) {
        this._config.src = src;
        this.stop();
        this.makeSourceNode();
    }

    /**
     * Returns the 3D Space of the Sound.
     */

    get pos () {
        return this._pos;
    }

    set pos (p) {
        this._pos = p;
        this.configureNodes();
    }

    get volume () {
        return this._config.volume * 100;
    }

    set volume (v) {
        this._config.volume = v / 100; // for some reason, it can go above 1?
        this.configureNodes();
    }

    get pitch () {
        return this._config.pitch * 100;
    }

    set pitch (p) {
        this._config.pitch = p / 100;
        this.configureNodes();
    }

    /**
     * Returns the Stero Pan of the Sound.
     */

    get pan () {
        return this._config.pan * 100;
    }

    set pan (pan) {
        this._config.pan = Math.max(Math.min(pan, 100), -100) / 100;
        this.configureNodes();
    }

    /**
     * Returns wheather or not the Sound is looping.
     */

    get loop () {
        return this._config.loop;
    }

    set loop (loop) {
        this._config.loop = loop;
        this.configureNodes();
    }

    // Sound methods:

    /**
     * Configures the nodes, This is called by the getters and setters of the
     * Sound, This configures the MAIN nodes on the fly.
     * 
     * You can use the _config property to change different things on the sound
     * and call configureNodes whenenver you would like your changes to be added to
     * the Sound. (wheather playing or not.)
     */

    configureNodes () {
        this.gain!.gain.value = this._config.volume;
        this._pos.updateSoundPosition(this);
        this.steroPanner!.pan.value = this._config.pan;
        if (this.source) {
            this.source.detune.value = this._config.pitch;
            this.source.loop = this._config.loop;
        }
    }

    private createNodes () {
        var ctx = this.context, gain:GainNode, panner:PannerNode, stero:StereoPannerNode;
        gain = ctx.createGain();
        panner = ctx.createPanner();
        stero = ctx.createStereoPanner();

        // connect nodes:
        gain.connect(ctx.destination);
        stero.connect(gain);
        panner.connect(stero);

        // bind nodes:
        this.gain = gain;
        this.steroPanner = stero;
        this.panner = panner;

        // configure nodes:
        this.configureNodes();
    }

    // Sound Linking AudioNodes: (hard to do? probably.)

    /**
     * Unlinks all of the **currently** connected nodes that are connected to the
     * AudioContext's destination.
     */

    public unlinkNodes () {
        var nodesToUnlink:Array<AudioNode> = [this.context.destination, this.gain!, this.steroPanner!, this.panner!];
        nodesToUnlink = nodesToUnlink.concat(this._connectedNodes);
        nodesToUnlink = nodesToUnlink.concat(this.source!);
        nodesToUnlink.reverse();
        for (let i = 0; i < nodesToUnlink.length; i++) {
            const node = nodesToUnlink.shift();
            if ((!node) || (!(nodesToUnlink[0] instanceof AudioNode)))
                break;
            node.disconnect(nodesToUnlink[0]);
        }
        this._connectedNodes = [];
    }

    /**
     * Links **all** of the nodes together
     * 
     * *(including the ones the developer specified)*
     */

    public linkNodes () {
        this.unlinkNodes();
        var nodesToLink:Array<AudioNode> = [this.steroPanner!, this.panner!];
        nodesToLink = nodesToLink.concat(this.nodes, this.source!);
        var linkTo:AudioNode = this.gain!;
        for (let i = 0; i < nodesToLink.length; i++) {
            const node = nodesToLink[i];
            node.connect(linkTo);
            this._connectedNodes.push(node);
            linkTo = node;
        }
    }

    // Sound Buffer Handling:

    private async getSoundBuffer ():Promise<AudioBuffer> {
        return new Promise((resolve, reject) => {
            if (this.buffer instanceof AudioBuffer)
                resolve(this.buffer);
            var source = this._config.src, ctx = this.context, self = this;
            if (source instanceof ArrayBuffer) {
                ctx.decodeAudioData(source, (dta) => {
                    resolve(dta);
                }, (err) => { reject(err); });
            }
            if (typeof source == "string") {
                var lnk:string = window.location.origin + "/" + source;
                if (isDirectURL(source))
                    lnk = source;
                var req = new XMLHttpRequest();
                req.open("GET", lnk, true);
                req.responseType = "arraybuffer";
                req.onload = function () {
                    ctx.decodeAudioData(req.response, (dta) => {
                        resolve(dta);
                    }, (err) => { reject(err) });
                }
                req.onerror = (ev) => { reject(ev.toString()); };
                req.send(null);
            }
            if (source instanceof AudioBuffer) {
                resolve(source);
            }
            reject("Invalid Source Type.");
        });
    }

    // Sound Source Making:

    private async makeSourceNode () {
        var buffer = (await this.getSoundBuffer()), ctx = this.context, source:AudioBufferSourceNode;

        if (this.source) {
            this.unlinkNodes();
            this.source = null;
        }

        source = ctx.createBufferSource();
        source.buffer = buffer; // @ts-ignore
        this._hasPlayedYet = false;

        this.linkNodes();
        
        this.source = source;
        if (this.onload instanceof Function)
            this.onload.call(null, buffer, source);
    }

    // Sound API Interface:

    /**
     * Plays the Sound
     * 
     * If any of the parameters below are specified they will be put into
     * the AudioSourceNode's start function.
     * @param when When to start playing the sound (OPTIONAL)
     * @param offset The offset (OPTIONAL)
     * @param duration The duration to play for (OPTIONAL)
     */

    public play (when?:number, offset?:number, duration?:number) {
        if (!this.buffer || !this.source)
            throw new Error("The Sound hasn't finished loading yet!");
        if (this._hasPlayedYet) {
            this.makeSourceNode(); // @ts-ignore
            this.onload = () => { this.play.apply(this, arguments); };
            return;
        }
        if (this.saveOffset != 0) {
            when = this.saveOffset;
            this.saveOffset = 0;
        }
        if (this.source && !this._hasPlayedYet) {
            this.context.resume();
            this._hasPlayedYet = true;
            this.source.start(when, offset, duration);
            this.source.onended = (e) => {
                this.source!.stop();
                this.makeSourceNode();
                if (this.onended instanceof Function)
                    this.onended(e);
            }
        }
    }

    /**
     * Pauses the sound and saves the time.
     */

    public pause () {
        if (!this.buffer || !this.source)
            throw new Error("The Sound hasn't finished loading yet!");
        this.saveOffset = this.context.currentTime;
        this.context.suspend(); // like pause timer? (i guess?)
        this.source.stop();
        this.makeSourceNode();
        if (this.onended instanceof Function)
            this.onended(null);
    }

    /**
     * Fully stops the sound and sets the pauseOffset property to zero.
     */

    public stop () {
        if (!this.buffer || !this.source)
            throw new Error("The Sound hasn't finished loading yet!");
        this.saveOffset = 0;
        this.context.suspend();
        this.source.stop();
        this.makeSourceNode();
        if (this.onended instanceof Function)
            this.onended(null);
    }

    /**
     * Makes a copy of this sound and returns it.
     * @returns The copy of this sound
     */

    public copy () {
        var sound = new Sound(this.src);
        sound.pitch = this.pitch;
        sound.volume = this.volume;
        sound.nodes = this.nodes;
        sound.loop = this.loop;
        sound.pos = this.pos.copy();
        sound.saveOffset = this.saveOffset;
        sound.pan = this.pan;
        return sound;
    }
}

export { Sound };