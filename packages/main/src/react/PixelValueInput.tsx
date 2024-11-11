import { useEffect, useState } from "react";
import { Input } from "./Input";
import { Variables } from "./Variables";

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
        <Input
            afterValue={
                <span
                    css={{
                        marginLeft: Variables.size.spacing.xs,
                        fontSize: Variables.size.font.xs,
                        color: Variables.color.foregroundWeak,
                    }}
                >
                    px
                </span>
            }
            value={value}
            inputMode="numeric"
            onKeyDown={(ev) => ev.stopPropagation()}
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
    );
}
