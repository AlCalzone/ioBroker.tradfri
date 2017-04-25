/// <binding ProjectOpened='watch' />
var gulp = require('gulp'),
	rename = require('gulp-rename'),
	clean = require('gulp-clean'),
	concat = require('gulp-concat'),
	plumber = require('gulp-plumber'),
	naturalSort = require('gulp-natural-sort'),
	babel = require('gulp-babel'),
	sourcemaps = require('gulp-sourcemaps')
	//gulpSSH = require('gulp-ssh'),
	//git = require('gulp-git')
	//shell = require('gulp-shell')
	//exec = require('child_process').exec
	;

//// Notwendige Funktionen für NPM-GIT-Pack
//var fs = require('fs-extra'),
//	path = require('path')
//	;
//// FS-Funktionen in Promises kapseln
//function promisify(fn, context) {
//	return function (...args) {
//		context = context || this;
//		return new Promise(function (resolve, reject) {
//			fn.apply(context, [...args, function (error, result) {
//				if (error)
//					return reject(error);
//				else
//					return resolve(result);
//			}]);
//		});
//	}
//}
//const _fs = {
//	copy:       promisify(fs.copy),
//	exists:     promisify(fs.exists),
//	readFile:   promisify(fs.readFile),
//	writeFile:  promisify(fs.writeFile),
//	unlink:     promisify(fs.unlink),
//	readdir:    promisify(fs.readdir),
//	lstat:      promisify(fs.lstat),
//	emptyDir:	promisify(fs.emptyDir)
//}
//const execP = function (cmd, opt) {
//	return new Promise(function (resolve, reject) {
//		exec(cmd, opt, function (err, stdout, stderr) {
//			if (err) return reject(stderr);
//			return resolve(stdout);
//		});
//	})
//}


// JS-Main-Script
gulp.task('script-es2017', function () {
	return gulp.src('src/**/*.js'/*, { base: 'src' }*/)
		.pipe(plumber())
		.pipe(sourcemaps.init())
		.pipe(babel())
		.pipe(sourcemaps.write("../maps", { includeContent: false, sourceRoot: "../src" }))
		.pipe(gulp.dest(''))
		;
})

// Default task
gulp.task('default', function () {
	gulp.start('script-es2017'/*, 'images'*/);
});

// Watch
gulp.task('watch', function () {

	// Watch .js files
	gulp.watch('src/**.js', ['script-es2017']);

});

// Clean
//gulp.task('clean-build', function () {
//	return gulp
//		.src('build/', { read: false })
//		.pipe(clean())
//		;
//});

/*const copyMode = {
	release: 0,
	debug: 1,
}
async function publishFiles(mode = copyMode.release) {
	let {name, buildDir, additionalFiles, releaseOptions, debugOptions} = JSON.parse(
		await _fs.readFile(__dirname + "\\npm-git-pack.json")
	);

	console.log(`== publishing files in ${enums.getEnumValueAsName(copyMode, mode)} mode`);

	const options = (mode == copyMode.release ? releaseOptions : debugOptions);

	// Zielordner für Kopien
	let targetDir = options.targetDir;
	if (!path.isAbsolute(targetDir))
		targetDir = path.join(__dirname, targetDir, name);
	console.log(`target dir: "${targetDir}"`);

	// Ordner leeren
	const emptyDirs = options.emptyDirectories
		.map(dir => _fs.emptyDir(path.join(targetDir, dir)))
		;
	await Promise.all(emptyDirs);

	// Filter für zusätzliche Dateien
	if (options.additionalFiles)
		additionalFiles.push(...options.additionalFiles);
	const filesRegex = additionalFiles
		.filter(f => f.indexOf("*") > -1 || f.indexOf("!") > -1)
		.map(f => new RegExp(
			f
				.replace(".", "\.") // Punkte als solche matchen
				.replace("/", "[\\\\/]") // Pfad-Trenner als / und \
				.replace("*", ".*") // Wildcard in Regex umsetzen
				.replace("!", "?!") // negative lookahead
		));
	console.log(`${filesRegex.length} wildcards defined...`);
	// Zusätzliche Dateien kopieren
	const filterFunc = function (src, dest) {
		const relSrc = path.relative(__dirname, src);

		// Root-Verzeichnis
		if (relSrc === "") {
			console.log(`copying "${relSrc}" (rootDir)`)
			return true;
		}
		// Exaktes Match in Dateien-Liste
		if (additionalFiles.indexOf(relSrc) > -1) {
			console.log(`copying "${relSrc}" (exact match)`)
			return true;
		}
		// Ordner, aus dem Dateien kopiert werden sollen
		if (fs.lstatSync(src).isDirectory()) {
			if (additionalFiles.filter(f => f.startsWith(relSrc + "/")).length > 0) {
				console.log(`copying "${relSrc}" (directory)`)
				return true;
			}
		}
		// Wildcards
		if (filesRegex.filter(f => f.test(relSrc)).length > 0) {
			console.log(`copying "${relSrc}" (wildcard)`)
			return true;
		}

		return false;
	}
	await _fs.copy(__dirname, targetDir, { filter: filterFunc });

	// Build-Ergebnisse kopieren
	if (buildDir)
		await _fs.copy(path.join(__dirname, buildDir), targetDir);

	console.log("copy done");

	if (mode == copyMode.release) {
		console.log("doing git magic...");

		let commands = [
			"git add -A",
			'git commit -m "automatic commit by npm-git-pack"',
			"git push origin master"
		]

		for (let cmd of commands) {
			try {
				console.log(await execP(cmd, { cwd: targetDir }));
			} catch (e) {
				console.log(`error while doing git magic: ${e}`);
				break;
			}
		}
		console.log("git magic done...");
	}

	console.log("== publish done ==");
}

// NPM-Module erstellen
gulp.task('publish-release', async function () {
	await publishFiles(copyMode.release);
});
gulp.task('publish-debug', async function () {
	await publishFiles(copyMode.debug);
});