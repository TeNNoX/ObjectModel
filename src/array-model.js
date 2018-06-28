Model[ARRAY] = function ArrayModel(def){

	var model = function(array) {
		array = defaultTo(model[DEFAULT], array);

		var proxy;
		model[VALIDATE](array);
		if(isProxySupported){
			proxy = new Proxy(array, {
				get: function (arr, key) {
					if(key === CONSTRUCTOR){
						return model;
					} else if(ARRAY_MUTATOR_METHODS.indexOf(key) >= 0){
						return proxifyArrayMethod(arr, key, model);
					}
					return arr[key];
				},
				set: function (arr, key, val) {
					setArrayKey(arr, key, val, model);
				},
				getPrototypeOf: function(){
					return model[PROTO];
				}
			});
		} else {
			proxy = Object.create(Array[PROTO]);
			for(var key in array){
				if(has(array, key)){
					proxifyArrayKey(proxy, array, key, model);
				}
			}
			defineProperty(proxy, "length", { get: function() { return array.length; } });
			defineProperty(proxy, "toJSON", { value: function() { return array; } });
			ARRAY_MUTATOR_METHODS.forEach(function (method) {
				define(proxy, method, proxifyArrayMethod(array, method, model, proxy));
			});
			setConstructor(proxy, model);
		}

		return proxy;
	};

	setConstructorProto(model, Array[PROTO]);
	initModel(model, arguments, Model[ARRAY]);
	return model;
};

setConstructorProto(Model[ARRAY], Model[PROTO]);
var ArrayModelProto = Model[ARRAY][PROTO];

ArrayModelProto.toString = function(stack){
	return ARRAY + ' of ' + toString(this[DEFINITION], stack);
};

// private methods
define(ArrayModelProto, VALIDATOR, function(arr, path, callStack, errorStack){
	if(!is(Array, arr)){
		var err = {};
		err[EXPECTED] = this;
		err[RECEIVED] = arr;
		err[PATH] = path;
		errorStack.push(err);
	} else {
		for(var i=0, l=arr.length; i<l; i++){
			arr[i] = checkDefinition(arr[i], this[DEFINITION], (path||ARRAY)+'['+i+']', callStack, errorStack, true);
		}
	}
	checkAssertions(arr, this, path, errorStack);
});

function proxifyArrayKey(proxy, array, key, model){
	defineProperty(proxy, key, {
		enumerable: true,
		get: function () {
			return array[key];
		},
		set: function (val) {
			setArrayKey(array, key, val, model);
		}
	});
}

function proxifyArrayMethod(array, method, model, proxy){
	return function() {
		var testArray = array.slice();
		Array[PROTO][method].apply(testArray, arguments);
		model[VALIDATE](testArray);

		if(!isProxySupported){
			for(var key in testArray){ // proxify new array keys if any after method call
				if(has(testArray, key) && !(key in proxy)){
					proxifyArrayKey(proxy, array, key, model);
				}
			}
		}

		var returnValue = Array[PROTO][method].apply(array, arguments);
		for(var i=0, l=array.length; i<l; i++) {
			array[i] = cast(array[i], model[DEFINITION]);
		}
		return returnValue;
	};
}

function setArrayKey(array, key, value, model){
	var path = ARRAY+'['+key+']';
	if(parseInt(key) === +key && key >= 0){
		value = checkDefinition(value, model[DEFINITION], path, [], model[ERROR_STACK], true);
	}
	var testArray = array.slice();
	testArray[key] = value;
	checkAssertions(testArray, model, path, model[ERROR_STACK]);
	model[UNSTACK]();
	array[key] = value;
}