import {BUILD_ROOT, buildWatch, serve, SOURCE_ROOT} from "./lib";

serve(BUILD_ROOT);
buildWatch(SOURCE_ROOT, BUILD_ROOT);