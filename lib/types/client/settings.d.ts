/** settingsScope 解码: 将 Host 设置文档的 wire section 收窄为类型化结构. */
import { type CmdSendSettings } from '../shared.ts';
/**
 * 将 Host 解析后的 section 解码为 CmdSendSettings.
 * @param section - Host 设置文档中该命名空间的 section (schema 已应用默认值).
 * @returns 类型化设置, 或 undefined (结构不符时退回默认).
 */
export declare function decodeCmdSend(section: unknown): CmdSendSettings | undefined;
