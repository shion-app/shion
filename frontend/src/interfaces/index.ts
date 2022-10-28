import { main } from "../../wailsjs/go/models";

export type RawRecord = Pick<main.Record, 'name' | 'type' | 'exe'>;