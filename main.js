document.querySelector("#read_file").addEventListener("change", readFile, false);
document.querySelector("#sel_file").addEventListener("click", () => {
	document.querySelector("#read_file").click();
}, false);
document.querySelector("#dlb").addEventListener("click", download, false);
document.querySelectorAll("div[sel]").forEach(ele => {
	ele.classList.add("sel");
	ele.addEventListener('click', function (e) {
		ele.querySelector("input").click();
	});
});

let filedata = null;
let sorted_file = null;

function run() {
	let color_data = JSON.parse(filedata);

	sorted_file = null;
	document.querySelectorAll("[id^=colortable]").forEach(ele => ele.remove());
	if (!color_data) return;
	//console.log(color_data);

	let color_pool = [];
	let exclude = ["lstColorSample", "select"];
	let extra = {};

	extra[exclude[0]] = color_data[exclude[0]];
	extra[exclude[1]] = color_data[exclude[1]];

	Object.keys(color_data)
		.filter(key => !(exclude.some(text => key == text)))
		.forEach(key => {
			color_pool.push(color_data[key]);
		});
	color_pool = color_pool.flat();
	console.log("color_pool input");
	console.log(color_pool);

	// remove duplicate
	if (document.getElementById("rd").checked) {
		let id_set = new Set([]);
		color_pool.forEach(color => {
			let { r, g, b, a } = color;
			color.id = `${r}${g}${b}${a}`;
			id_set.add(color.id);
		});
		id_set = [...id_set].map(id => color_pool.find(color => color.id == id));
		id_set.forEach(color => delete color.id);
		console.log(id_set)
		console.log(`remove ${color_pool.length - id_set.length} duplicate color`);
		color_pool = id_set;
	}

	let sorted;
	if (document.getElementById("sort").checked) {
		color_pool = color_pool.map(color => toFF(color));
		console.log("color_pool converted");
		console.log(color_pool);

		sorted = sortColor(color_pool);
		console.log("color_pool sorted");
		console.log(sorted);
		showColor(sorted);

		sorted = sorted.map(cluster => cluster.colors);
		sorted = sorted.flat();
		sorted = sorted.map(color => color._primaryColor.original);
		console.log(sorted);
	} else {
		sorted = color_pool;
		color_pool = color_pool.map(color => toFF(color));
		showColor([{ name: 'cl', colors: color_pool.map(colorutil.color) }]);
	}

	// make new file
	let new_file = extra;
	let index = 0;
	let pre = "lstColor0";
	let new_list = [];
	let count = 0;
	let last_index = sorted.length - 1;
	sorted.forEach((color, c_index) => {
		new_list.push(color);
		count++;
		if ((count > 0 && (count % 90 == 0)) || c_index == last_index) {
			index++;
			new_file[`${pre}${index}`] = new_list;
			new_list = [];
		}
	});
	console.log(new_file);
	new_file = JSON.stringify(new_file);
	//console.log(new_file);
	sorted_file = new_file;
}

function download() {
	if (sorted_file) {
		let blob = new Blob([sorted_file], { type: 'text/plain', endings: 'native' });
		let filename = "ColorPresets.json";
		if (window.navigator.msSaveOrOpenBlob) {
			window.navigator.msSaveBlob(blob, filename);
		} else {
			let ele = window.document.createElement('a');
			ele.href = window.URL.createObjectURL(blob);
			ele.download = filename;
			document.body.appendChild(ele);
			ele.click();
			document.body.removeChild(ele);
		}
	}
}

function showColor(colors) {
	let table_count = 0;
	let color_count = 0;
	let c_ele = document.createElement("div");
	c_ele.id = `colortable_${table_count}`;
	c_ele.classList.add("cluster");
	document.getElementById("table").appendChild(c_ele);

	colors.forEach(cluster => {
		if (cluster.colors.length > 0) {
			/*
			let p = document.createElement("div");
			p.id = `colortable_${cluster.name}`;
			p.classList.add("cluster");
			document.body.appendChild(p);
			*/

			cluster.colors.forEach(color => {
				//addColor(color.cssrgba, p.id);

				addColor(color.cssrgba, c_ele.id);
				color_count++;

				if (color_count != 0 && color_count % 90 == 0) {
					table_count++;
					c_ele = document.createElement("div");
					c_ele.id = `colortable_${table_count}`;
					c_ele.classList.add("cluster");
					document.getElementById("table").appendChild(c_ele);
				}
			});
		}
	});

	function addColor(rgba, ele_id) {
		let div = document.createElement("div");
		div.style.backgroundColor = rgba;
		div.classList.add("color");
		document.getElementById(ele_id).appendChild(div);
	}
}

function readFile(event) {
	console.log("read file");
	let file = event.target.files[0];
	if (!file) return;

	let reader = new FileReader();
	reader.onload = async (event) => {
		filedata = event.target.result;
		console.log("file readed");
	};
	reader.readAsText(file);
}

function toFF({ r, g, b, a }) {
	function floatToInt(f) {
		return Math.round(0xff * f)
	}
	return {
		r: floatToInt(r),
		g: floatToInt(g),
		b: floatToInt(b),
		a: floatToInt(a),
		original: { r, g, b, a },
	}
}


// https://tomekdev.com/posts/sorting-colors-in-js

function colorDistance(color1, color2) {
	const x =
		Math.pow(color1[0] - color2[0], 2) +
		Math.pow(color1[1] - color2[1], 2) +
		Math.pow(color1[2] - color2[2], 2);
	return Math.sqrt(x);
}

function oneDimensionSorting(colors, dim) {
	return colors
		.sort((colorA, colorB) => {
			if (colorA.hsl[dim] < colorB.hsl[dim]) {
				return -1;
			} else if (colorA.hsl[dim] > colorB.hsl[dim]) {
				return 1;
			} else {
				return 0;
			}
		});
}

const
	cs = {
		c0: [ // 3
			{ name: 'red', leadColor: [255, 0, 0], colors: [] },
			{ name: 'green', leadColor: [0, 255, 0], colors: [] },
			{ name: 'blue', leadColor: [0, 0, 255], colors: [] },
		],
		c1: [ // 6
			{ name: 'red', leadColor: [255, 0, 0], colors: [] },
			{ name: 'yellow', leadColor: [255, 255, 0], colors: [] },
			{ name: 'green', leadColor: [0, 255, 0], colors: [] },
			{ name: 'blue', leadColor: [0, 0, 255], colors: [] },
			{ name: 'violet', leadColor: [127, 0, 255], colors: [] },
			{ name: 'magenta', leadColor: [255, 0, 255], colors: [] },
		],
		c2: [ // 12
			{ name: 'red', leadColor: [255, 0, 0], colors: [] },
			{ name: 'orange', leadColor: [255, 128, 0], colors: [] },
			{ name: 'yellow', leadColor: [255, 255, 0], colors: [] },
			{ name: 'chartreuse', leadColor: [128, 255, 0], colors: [] },
			{ name: 'green', leadColor: [0, 255, 0], colors: [] },
			{ name: 'spring green', leadColor: [0, 255, 128], colors: [] },
			{ name: 'cyan', leadColor: [0, 255, 255], colors: [] },
			{ name: 'azure', leadColor: [0, 127, 255], colors: [] },
			{ name: 'blue', leadColor: [0, 0, 255], colors: [] },
			{ name: 'violet', leadColor: [127, 0, 255], colors: [] },
			{ name: 'magenta', leadColor: [255, 0, 255], colors: [] },
			{ name: 'rose', leadColor: [255, 0, 128], colors: [] },
		],
		c3: [ // 24
			{ name: 'red', leadColor: [255, 0, 0], colors: [] },
			{ name: 'red2', leadColor: [255, 64, 0], colors: [] },
			{ name: 'orange', leadColor: [255, 128, 0], colors: [] },
			{ name: 'orange2', leadColor: [255, 192, 0], colors: [] },
			{ name: 'yellow', leadColor: [255, 255, 0], colors: [] },
			{ name: 'yellow2', leadColor: [192, 255, 0], colors: [] },
			{ name: 'chartreuse', leadColor: [128, 255, 0], colors: [] },
			{ name: 'chartreuse2', leadColor: [64, 255, 0], colors: [] },
			{ name: 'green', leadColor: [0, 255, 0], colors: [] },
			{ name: 'green2', leadColor: [0, 255, 64], colors: [] },
			{ name: 'spring green', leadColor: [0, 255, 128], colors: [] },
			{ name: 'spring green2', leadColor: [0, 255, 192], colors: [] },
			{ name: 'cyan', leadColor: [0, 255, 255], colors: [] },
			{ name: 'cyan2', leadColor: [0, 192, 255], colors: [] },
			{ name: 'azure', leadColor: [0, 127, 255], colors: [] },
			{ name: 'azure2', leadColor: [0, 63, 255], colors: [] },
			{ name: 'blue', leadColor: [0, 0, 255], colors: [] },
			{ name: 'blue2', leadColor: [63, 0, 255], colors: [] },
			{ name: 'violet', leadColor: [127, 0, 255], colors: [] },
			{ name: 'violet2', leadColor: [191, 0, 255], colors: [] },
			{ name: 'magenta', leadColor: [255, 0, 255], colors: [] },
			{ name: 'magenta2', leadColor: [255, 0, 191], colors: [] },
			{ name: 'rose', leadColor: [255, 0, 128], colors: [] },
			{ name: 'rose2', leadColor: [255, 0, 64], colors: [] },
		]
	},
	white = {
		w0: { name: 'white', leadColor: [255, 255, 255], colors: [] },
		w1: { name: 'white1', leadColor: [320, 320, 320], colors: [] },
		w2: { name: 'white2', leadColor: [350, 350, 350], colors: [] },
		w3: { name: 'white3', leadColor: [384, 384, 384], colors: [] },
	},
	black = {
		b0: { name: 'black', leadColor: [0, 0, 0], colors: [] },
		b1: { name: 'black1', leadColor: [-10, -10, -10], colors: [] },
		b2: { name: 'black2', leadColor: [-25, -25, -25], colors: [] },
	};

function dcopy(source) {
	return JSON.parse(JSON.stringify(source));
}

function sortColor(colorsToSort = []) {
	let isadv = document.getElementById("adv").checked;
	let clusters = [];
	const mappedColors = colorsToSort.map(colorutil.color);

	if (!isadv) {
		clusters = dcopy(cs.c1);
	} else {
		let id = document.querySelector("#cluster input:checked").id;
		clusters = dcopy(cs[id]);

		id = document.querySelector("#white input:checked").id;
		if (id != "wn") clusters.push(dcopy(white[id]));

		id = document.querySelector("#black input:checked").id;
		if (id != "bn") clusters.push(dcopy(black[id]));
	}

	mappedColors.forEach((color) => {
		let minDistance;
		let minDistanceClusterIndex;
		clusters.forEach((cluster, clusterIndex) => {
			const colorRgbArr = [color.rgb.r, color.rgb.g, color.rgb.b];
			const distance = colorDistance(colorRgbArr, cluster.leadColor);
			if (typeof minDistance === 'undefined' || minDistance > distance) {
				minDistance = distance;
				minDistanceClusterIndex = clusterIndex;
			}
		});
		clusters[minDistanceClusterIndex].colors.push(color);
	});

	let exclude = ["white", "black"];

	clusters.forEach((cluster) => {
		let sectors = [
			{ name: 'self', leadColor: cluster.leadColor, colors: [] },
			{ name: 'white', leadColor: [350, 350, 350], colors: [] },
			{ name: 'black', leadColor: [-25, -25, -25], colors: [] },
			/*
			{ name: 'white', leadColor: [255, 255, 255], colors: [] },
			{ name: 'black', leadColor: [0, 0, 0], colors: [] },
			*/
		];

		if (exclude.some(name => cluster.name == name)) {
			sectors = sectors.filter(sector => sector.name != cluster.name);
		}

		let alpha = { name: 'alpha', colors: [] };

		oneDimensionSorting(cluster.colors, 'l');
		oneDimensionSorting(cluster.colors.reverse(), 's');
		cluster.colors = cluster.colors.reverse();

		cluster.colors.forEach(color => {
			if (color.rgb.a == 255) {
				let minDistance;
				let minDistanceSectorsIndex;
				sectors.forEach((sector, sectorIndex) => {
					const colorRgbArr = [color.rgb.r, color.rgb.g, color.rgb.b];
					const distance = colorDistance(colorRgbArr, sector.leadColor);
					if (typeof minDistance === 'undefined' || minDistance > distance) {
						minDistance = distance;
						minDistanceSectorsIndex = sectorIndex;
					}
				});
				sectors[minDistanceSectorsIndex].colors.push(color);
			} else {
				alpha.colors.push(color);
			}
		});

		// evey color is the closest color to the pervious one
		// use leadColor as first input

		let new_color_list = [];
		if (alpha.colors.length > 0) {
			new_color_list.push(alpha.colors);
		}
		sectors.forEach(sector => {
			if (sector.colors.length > 0) {
				let temp = sector.colors;
				let next = closestColor(temp, sector.leadColor);
				let new_list = [next.best];
				temp = next.rest;

				while (temp.length > 0) {
					next = closestColor(temp, next.best);
					new_list.push(next.best);
					temp = next.rest;
					if (next.rest.length == 0) break;
				}
				new_color_list.push(new_list);
			}
		});

		cluster.colors = new_color_list.flat();
		//console.log(cluster.name, cluster.colors);
	});

	return clusters;
}

function closestColor(color_list = [], pervious) {
	let new_list = [];

	if (!(pervious instanceof Array)) {
		pervious = [pervious.rgb.r, pervious.rgb.g, pervious.rgb.b]
	}

	color_list.forEach(color => {
		let colorRgbArr = [color.rgb.r, color.rgb.g, color.rgb.b];
		new_list.push({
			distance: colorDistance(colorRgbArr, pervious),
			color: color,
		});
	});
	new_list.sort((a, b) => a.distance - b.distance);
	/*
	let distance_map = [];
	distance_map = new_list.map(o => o.distance);
	console.log(distance_map);
	*/
	new_list = new_list.map(obj => obj.color);

	let best, rest;
	[best, ...rest] = new_list;

	//console.log(new_list);
	return { best, rest };
}
