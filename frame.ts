import * as THREE from "./three.module";

type ImgInfo = {
    /**
     * 路径
     */
    src: string;
    /**
     * 图片宽度
     */
    width: number;
    /**
     * 图片高度
     */
    height: number;

    /**
     * 帧图像宽度
     */
    fWidth: number;
    /**
     * 帧图像高度
     */
    fHeight: number;

    /**
     * 总共多少帧
     */
    count: number
}

type FrameInfo = {
    /**
     * 面片宽度
     */
    width: number;
    /**
     * 面片高度
     */
    height: number;
    /**
     * 持续时间
     */
    duration: number;
    /**
     * 循环播放，默认是 true
     */
    loop?: boolean;
}

export class Frame {
    /**
     * 帧动画的mesh
     */
    public readonly mesh: THREE.Mesh;

    private index: number = 0;
    private paused: boolean = true;
    private updateTime: number = 0;

    private readonly cb: Function;
    private readonly loop: boolean = true;
    private readonly count: number;
    private readonly column: number;
    private readonly duration: number;

    private readonly offsetX: number;
    private readonly offsetY: number;

    /**
     * 创建帧动画
     * @param img 帧图像信息
     * @param frame 帧动画信息
     * @param cb 回调
     */
    constructor(img: ImgInfo, frame: FrameInfo, cb?: () => void) {
        this.cb = cb;
        this.loop = frame.loop;
        this.count = img.count;
        this.column = img.width/img.fWidth;
        this.duration = frame.duration * 60;

        this.offsetX = img.width / img.fWidth;
        this.offsetY = img.height / img.fHeight;

        const geometry = new THREE.PlaneBufferGeometry(frame.width, frame.height, 1, 1);
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, this.offsetX, 1, 0, 1 - this.offsetY, this.offsetX, 1 - this.offsetY], 2));

        const material = new THREE.MeshLambertMaterial({
            transparent: true,
            emissive: 0xffffff,
            map: new THREE.TextureLoader().load(img.src)
        });

        this.mesh = new THREE.Mesh(geometry, material);
    }

    private nextFrame = () => {
        const x = this.index % this.column;
        const y = (this.index - x) / this.column;
        (this.mesh.material as THREE.MeshLambertMaterial).map.offset.set(this.offsetX * x, -this.offsetY * y);
    }

    /**
     * 每帧更新
     */
    public update = () => {
        if (this.paused) return;

        if (!this.loop && this.index >= this.count) return;

        if (++this.updateTime >= this.duration * (this.index + 1) / this.count) {
            if (++this.index >= this.count) {
                if (this.loop) {
                    this.updateTime = 0;
                    this.index = 0;
                } else {
                    this.cb && this.cb();
                }
            }
            this.nextFrame();
        }

    }

    /**
     * 开始播放
     * @param reset 从头播放
     */
    public play = (reset = false) => {
        this.paused = false;
        if (reset) {
            this.updateTime = 0;
            this.index = 0;
        }
    }

    /**
     * 停止播放
     */
    public pause = () => {
        this.paused = true;
    }

    /**
     * 面片朝向
     * @param position 面片位置
     * @param normal 朝向位置
     */
    public faceTo = (position: THREE.Vector3, normal: THREE.Vector3) => {
        const pos = new THREE.Vector3().addVectors(position, normal);
        // 防止闪烁
        this.mesh.position.copy(normal).multiplyScalar(0.1);
        this.mesh.lookAt(pos);
    }
}