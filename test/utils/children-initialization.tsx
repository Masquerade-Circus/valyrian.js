import { nodeVersion } from "./children-bootstrap";
import { isNodeJs, type Vnode } from "valyrian.js";

export const result = [nodeVersion, isNodeJs, (<span>x</span> as Vnode).children[0]];
