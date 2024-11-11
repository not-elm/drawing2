import { useCallback, useEffect, useMemo, useRef } from "react";
import { Color } from "../core/Color";
import { Button } from "./Button";
import { Card } from "./Card";
import { Variables } from "./Variables";
import { useApp } from "./hooks/useApp";
import { useCell } from "./hooks/useCell";

export function ColorPicker({
    value,
    onChange,
}: {
    value: Color;
    onChange: (value: Color) => void;
}) {
    const { hue, saturation, brightness } = Color.toHSB(value);
    const app = useApp();
    const colorHistory = useCell(app.colorHistory);

    const baseColor = useMemo(() => {
        return Color.hsb(hue, saturation, brightness);
    }, [hue, saturation, brightness]);

    return (
        <Card css={{ paddingTop: 16 }}>
            <div
                css={{
                    borderTop: "1px solid",
                    borderTopColor: Variables.color.border,
                }}
            >
                <SaturationBrightnessPicker
                    hue={hue}
                    saturation={saturation}
                    brightness={brightness}
                    onChange={(saturation, brightness) => {
                        onChange(Color.hsb(hue, saturation, brightness));
                    }}
                />
            </div>
            <div
                css={{
                    borderTop: "1px solid",
                    borderTopColor: Variables.color.border,
                    paddingBlock: Variables.size.spacing.sm,
                    paddingInline: Variables.size.spacing.md,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,
                }}
            >
                <ColorPreview value={value} />
                <div css={{ flex: "1 1 0" }}>
                    <CanvasRangeInput
                        value={hue}
                        onChange={(hue) => {
                            onChange(Color.hsb(hue, saturation, brightness));
                        }}
                        renderFunction={renderHueGradation}
                    />
                    <CanvasRangeInput
                        value={value.a}
                        onChange={(alpha) => {
                            onChange({
                                ...Color.hsb(hue, saturation, brightness),
                                a: alpha,
                            });
                        }}
                        renderFunction={(canvas) =>
                            renderAlphaGradation(canvas, baseColor)
                        }
                    />
                </div>
            </div>
            <div
                css={{
                    borderTop: "1px solid",
                    borderTopColor: Variables.color.border,
                    padding: Variables.size.spacing.sm,
                    display: "grid",
                    gridTemplateColumns: "repeat(6, 48px)",
                    gap: 0,
                }}
            >
                {colorHistory.colors.map((color) => (
                    <Button key={Color.stringify(color)}>
                        <ColorPreview value={color} />
                    </Button>
                ))}
            </div>
        </Card>
    );
}

function SaturationBrightnessPicker({
    hue,
    saturation,
    brightness,
    onChange,
}: {
    hue: number;
    saturation: number;
    brightness: number;
    onChange: (saturation: number, brightness: number) => void;
}) {
    const handleChange = useCallback(
        (ev: PointerEvent) => {
            const canvas = canvasRef.current;
            if (canvas === null) return;

            const rect = canvas.getBoundingClientRect();

            const saturation = Math.max(
                0,
                Math.min((ev.clientX - rect.left) / rect.width, 1),
            );
            const brightness = Math.max(
                0,
                Math.min(1 - (ev.clientY - rect.top) / rect.height, 1),
            );

            onChange(saturation, brightness);
        },
        [onChange],
    );

    const onDragStart = useDrag({
        onMove: (ev) => handleChange(ev),
    });

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const shaderRef = useRef<((hue: number) => void) | null>(null);

    useEffect(() => {
        shaderRef.current?.(hue);
    }, [hue]);

    return (
        <div
            css={{
                position: "relative",
                overflow: "clip",
                width: "100%",
                height: "240px",
            }}
        >
            <canvas
                css={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                }}
                ref={(e) => {
                    canvasRef.current = e;
                    shaderRef.current = null;
                    if (e === null) return;

                    const gl = e.getContext("webgl");
                    if (gl === null) return;

                    shaderRef.current =
                        createSaturationBrightnessGradationShader(gl);
                }}
                onPointerDown={(ev) => {
                    ev.preventDefault();
                    handleChange(ev.nativeEvent);
                    onDragStart();
                }}
            />
            <div
                style={{
                    left: `${saturation * 100}%`,
                    top: `${(1 - brightness) * 100}%`,
                }}
                css={{
                    position: "absolute",
                    transform: "translate(-50%, -50%)",
                    width: "8px",
                    height: "8px",
                    border: "3px solid #fff",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                    borderRadius: "50%",
                }}
            />
        </div>
    );
}

function CanvasRangeInput({
    value,
    onChange,
    renderFunction,
}: {
    value: number;
    onChange: (value: number) => void;
    renderFunction: (canvas: HTMLCanvasElement) => void;
}) {
    const handleChange = useCallback(
        (ev: PointerEvent) => {
            const container = containerRef.current;
            if (container === null) return;

            const rect = container.getBoundingClientRect();
            const value = Math.max(
                0,
                Math.min((ev.clientX - rect.left) / rect.width, 1),
            );

            onChange(value);
        },
        [onChange],
    );

    const onDragStart = useDrag({
        onMove: (ev) => handleChange(ev),
    });

    const containerRef = useRef<HTMLDivElement | null>(null);

    return (
        <div
            ref={containerRef}
            css={{
                position: "relative",
                height: "16px",
                width: "100%",
                paddingBlock: Variables.size.spacing.xs,
            }}
            onPointerDown={(ev) => {
                ev.preventDefault();
                handleChange(ev.nativeEvent);
                onDragStart();
            }}
        >
            <canvas
                css={{
                    height: "16px",
                    width: "100%",
                }}
                ref={(e) => {
                    if (e === null) return;
                    renderFunction(e);
                }}
            />
            <div
                style={{
                    left: `${Math.max(0, Math.min(value, 1)) * 100}%`,
                }}
                css={{
                    position: "absolute",
                    top: 0,
                    width: "4px",
                    height: "24px",
                    background: "#fff",
                    border: "1px solid",
                    borderColor: Variables.color.border,
                    borderRadius: Variables.size.borderRadius.md,
                    transform: "translate(-50%)",
                }}
            />
        </div>
    );
}

export function ColorPreview({
    value,
}: {
    value: Color;
}) {
    return (
        <div
            css={{
                position: "relative",
                height: "12px",
                width: "12px",
                overflow: "clip",
                borderColor: Variables.color.border,
                borderRadius: "50%",
            }}
        >
            <canvas
                css={{
                    position: "absolute",
                    inset: 0,
                    height: "100%",
                    width: "100%",
                }}
                ref={(e) => {
                    if (e === null) return;

                    const ctx = e.getContext("2d");
                    if (ctx === null) return;

                    renderCheckerBoard(ctx);
                }}
            />
            <div
                style={{
                    background: Color.stringify(value),
                }}
                css={{
                    position: "absolute",
                    inset: 0,
                }}
            />
        </div>
    );
}

function createSaturationBrightnessGradationShader(gl: WebGLRenderingContext) {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    if (vertexShader === null) return null;
    gl.shaderSource(
        vertexShader,
        `
    attribute vec2 position;
    void main() {
        gl_Position = vec4(position, 0.0, 1.0);
    }
`,
    );
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (fragmentShader === null) return null;
    gl.shaderSource(
        fragmentShader,
        `
    precision mediump float;
    uniform float hue;
    uniform vec2 resolution;

    //  https://www.shadertoy.com/view/MsS3Wc
    vec3 hsb2rgb(in vec3 c){
        vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
        rgb = rgb * rgb * (3.0 - 2.0 * rgb);
        return c.z * mix(vec3(1.0), rgb, c.y);
    }
    
    void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec3 hsb = vec3(hue, uv.x, uv.y);
        
        gl_FragColor = vec4(hsb2rgb(hsb), 1.0);
    }
`,
    );
    gl.compileShader(fragmentShader);

    const shaderProgram = gl.createProgram();
    if (shaderProgram === null) return null;
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    const positionAttributeLocation = gl.getAttribLocation(
        shaderProgram,
        "position",
    );
    const hueUniformLocation = gl.getUniformLocation(shaderProgram, "hue");
    const resolutionUniformLocation = gl.getUniformLocation(
        shaderProgram,
        "resolution",
    );

    return (hue: number) => {
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                -1.0,
                -1.0, // 左下
                1.0,
                -1.0, // 右下
                -1.0,
                1.0, // 左上
                -1.0,
                1.0, // 左上
                1.0,
                -1.0, // 右下
                1.0,
                1.0, // 右上
            ]),
            gl.STATIC_DRAW,
        );

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(shaderProgram);

        gl.uniform2f(
            resolutionUniformLocation,
            gl.canvas.width,
            gl.canvas.height,
        );
        gl.uniform1f(hueUniformLocation, hue);

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(
            positionAttributeLocation,
            2,
            gl.FLOAT,
            false,
            0,
            0,
        );
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
}

function renderHueGradation(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (ctx === null) return;

    const width = canvas.width;
    const height = canvas.height;

    for (let x = 0; x < width; x++) {
        const h = (x / width) * 360;
        ctx.fillStyle = `hsl(${h},100%,50%)`;
        ctx.fillRect(x, 0, 1, height);
    }
}

function renderAlphaGradation(canvas: HTMLCanvasElement, baseColor: Color) {
    const ctx = canvas.getContext("2d");
    if (ctx === null) return;

    const width = (canvas.width = canvas.clientWidth);
    const height = (canvas.height = canvas.clientHeight);

    ctx.clearRect(0, 0, width, height);

    renderCheckerBoard(ctx);

    const alphaGradation = ctx.createLinearGradient(0, 0, width, height);
    alphaGradation.addColorStop(
        0,
        `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0)`,
    );
    alphaGradation.addColorStop(
        1,
        `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 1)`,
    );
    ctx.fillStyle = alphaGradation;
    ctx.fillRect(0, 0, width, height);
}

function renderCheckerBoard(ctx: CanvasRenderingContext2D) {
    const width = (ctx.canvas.width = ctx.canvas.clientWidth);
    const height = (ctx.canvas.height = ctx.canvas.clientHeight);
    const GRID_SIZE = 8;

    ctx.clearRect(0, 0, width, height);

    for (let x = 0; x < width / GRID_SIZE; x++) {
        for (let y = 0; y < height / GRID_SIZE; y++) {
            ctx.fillStyle = (x + y) % 2 === 0 ? "#aaa" : "#666";
            ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        }
    }
}

function useDrag({
    onMove,
    onEnd,
}: {
    onMove?: (ev: PointerEvent) => void;
    onEnd?: (ev: PointerEvent) => void;
}): () => void {
    const isDraggingRef = useRef(false);

    useEffect(() => {
        const handlePointerMove = (ev: PointerEvent) => {
            if (!isDraggingRef.current) return;
            onMove?.(ev);
        };
        const handlePointerUp = (ev: PointerEvent) => {
            if (!isDraggingRef.current) return;
            isDraggingRef.current = false;
            onEnd?.(ev);
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);

        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };
    }, [onMove, onEnd]);

    return useCallback(() => {
        isDraggingRef.current = true;
    }, []);
}
