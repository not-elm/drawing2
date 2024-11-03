declare const __COMMIT_HASH__: string;

declare module "*.svg" {
    const SVGComponent: React.ComponentType<React.SVGAttributes<SVGElement>>;
    export default SVGComponent;
}
