import { contextBridge } from 'electron';
function readAdditionalArgument(name) {
    const prefix = `--${name}=`;
    const match = process.argv.find((arg) => arg.startsWith(prefix));
    return match ? match.slice(prefix.length) : undefined;
}
contextBridge.exposeInMainWorld('disGatewayDesktop', {
    apiBase: readAdditionalArgument('dis-gateway-api-base') ?? null,
    platform: process.platform,
});
