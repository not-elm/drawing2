import { useCallback, useEffect, useMemo, useRef } from "react";
import { Color } from "../../core/Color";
import { Button } from "../Button";
import { Card } from "../Card";
import { useApp } from "../hooks/useApp";
import { useCell } from "../hooks/useCell";

export function CustomColorPicker({
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
                    borderTop: "1px solid #eee",
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
                    borderTop: "1px solid #ccc",
                    padding: "8px 16px",
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
                    borderTop: "1px solid #eee",
                    padding: "8px 8px",
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

    const roundedHue = Math.floor(hue * 1024) / 1024;
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas === null) return;
        renderSBGradation(canvas, roundedHue);
    }, [roundedHue]);

    return (
        <div
            css={{
                position: "relative",
                overflow: "clip",
                width: "100%",
                height: "160px",
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
                    border: "1px solid #c0c0c0",
                    outline: "1px solid #666",
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
                padding: "4px 0",
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
                    border: "1px solid #c0c0c0",
                    borderRadius: "4px",
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
                height: "16px",
                width: "16px",
                overflow: "clip",
                border: "1px solid #eee",
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

function renderSBGradation(canvas: HTMLCanvasElement, hue: number) {
    const ctx = canvas.getContext("2d");
    if (ctx === null) return;

    const width = canvas.width;
    const height = canvas.height;

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            const s = x / width;
            const b = 1 - y / height;
            const color = Color.hsb(hue, s, b);

            ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }
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
