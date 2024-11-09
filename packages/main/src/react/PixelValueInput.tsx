import { useEffect, useState } from "react";
import { Input, InputBase } from "./Input";

export function PixelValueInput({
    onChange,
    value: originalValue,
}: {
    value: number;
    onChange?: (value: number) => void;
}) {
    const [value, setValue] = useState(`${originalValue}`);
    useEffect(() => {
        setValue(`${originalValue}`);
    }, [originalValue]);

    return (
        <div
            css={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                width: "80px",
                lineHeight: 1,
                padding: "0 8px",
                ...InputBase,
            }}
        >
            <Input
                onKeyDown={(ev) => ev.stopPropagation()}
                inputMode="numeric"
                css={{
                    flex: "1 1 0",
                    minWidth: "0",
                    outline: "none",
                    padding: 0,
                    border: "none",
                    borderRadius: "none",
                    background: "none",
                    minHeight: "auto",
                }}
                value={value}
                onChange={(ev) => {
                    setValue(ev.target.value);

                    const value = Number.parseInt(ev.target.value);
                    if (!Number.isNaN(value)) {
                        onChange?.(value);
                    }
                }}
                onBlur={() => {
                    setValue((value) => {
                        const parsed = Number.parseInt(value);
                        if (Number.isNaN(parsed)) {
                            return `${originalValue}`;
                        }
                        return `${parsed}`;
                    });
                }}
            />
            <span
                css={{
                    flex: "0 0 auto",
                    marginLeft: 4,
                    fontSize: "0.75em",
                    color: "#888",
                }}
            >
                px
            </span>
        </div>
    );
}
