import * as globals from "../dist/object-model.js"
Object.assign(global, globals);

require("./model.spec")
require("./basic-model.spec")
require("./any-model.spec")
require("./object-model.spec")
require("./array-model.spec")
require("./function-model.spec")
require("./map-model.spec")
require("./set-model.spec")