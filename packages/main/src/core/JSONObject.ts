type JSONPrimitive = string | number | boolean | null;
type JSONArray = JSONValue[];
type JSONValue = JSONPrimitive | JSONObject | JSONArray;

export interface JSONObject {
    [key: string]: JSONValue;
}
