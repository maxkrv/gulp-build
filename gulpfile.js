const {src,dest} = require("gulp"),
    gulp = require("gulp"),
    browsersync = require("browser-sync").create(),
    fileinclude = require("gulp-file-include"),
    del = require("del"),
    scss = require("gulp-sass"),
    autoprefixer = require("gulp-autoprefixer"),
    group_media = require("gulp-group-css-media-queries"),
    clean_css = require("gulp-clean-css"),
    rename = require("gulp-rename"),
    uglify = require("gulp-uglify-es").default,
    babel = require("gulp-babel"),
    imagemin = require("gulp-imagemin"),
    ttf2woff = require("gulp-ttf2woff"),
    ttf2woff2 = require("gulp-ttf2woff2"),
    fonter = require("gulp-fonter");


const project_folder = "dist";
const source_folder = "src";
const fs = require("fs");
const path = {
    build: {
        html: project_folder + "/",
        css: project_folder + "/assets/css/",
        js: project_folder + "/assets/js/",
        img: project_folder + "/assets/images/",
        fonts: project_folder + "/assets/fonts/",
    },
    src: {
        html: [source_folder + "/*.html", "!" + source_folder + "/_*.html"],
        css: source_folder + "/assets/scss/style.scss",
        js: source_folder + "/assets/js/script.js",
        img: source_folder + "/assets/images/**/*.{jpg,png,svg,webp,ico}",
        fonts: source_folder + "/assets/fonts/*.ttf ",
    },
    watch: {
        html: source_folder + "/**/*.html",
        css: source_folder + "/assets/scss/**/*.scss",
        js: source_folder + "/assets/js/**/*.js",
        img: source_folder + "/assets/images/**/*.{jpg,png,svg,webp,ico}",
    },
    clean: "./" + project_folder + "/"
}

function browserSync() {
    browsersync.init({
        server: {
            baseDir: "./" + project_folder + "/"
        },
        notify: false
    })
}

function html() {
    return src(path.src.html)
        .pipe(fileinclude())
        .pipe(dest(path.build.html))
        .pipe(browsersync.stream())
}

function css() {
    return src(path.src.css)
        .pipe(
            scss({
                outputStyle: "expanded"
            })
        )
        .pipe(
            group_media()
        )
        .pipe(
            autoprefixer({
                overrideBrowserslist: ["last 5 versions"],
                cascade: true
            })
        )
        .pipe(dest(path.build.css))
        .pipe(clean_css())
        .pipe(
            rename({
                extname: ".min.css"
            })
        )
        .pipe(dest(path.build.css))
        .pipe(browsersync.stream())
}

function js() {
    return src(path.src.js)
        .pipe(fileinclude())
        .pipe(dest(path.build.js))
        .pipe(babel({
            presets: ["@babel/preset-env"]
        }))
        .pipe(
            uglify()
        )
        .pipe(
            rename({
                extname: ".min.js"
            })
        )
        .pipe(dest(path.build.js))
        .pipe(browsersync.stream())
}

function images() {
    return src(path.src.img)
        .pipe(
            imagemin({
                interlaced: true,
                progressive: true,
                optimizationLevel: 3,
                svgoPlugins: [{
                    removeViewBox: false
                }]
            })
        )
        .pipe(dest(path.build.img))
        .pipe(browsersync.stream())
}

function fonts() {
    src(path.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts));
    return src(path.src.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(path.build.fonts));
}

gulp.task("otf2ttf", function () {
    return src([source_folder + '/assets/fonts/*.otf'])
        .pipe(fonter({
            formats: ["ttf"]
        }))
        .pipe(dest(source_folder + '/assets/fonts/'));
})

function fontsStyle() {
    let file_content = fs.readFileSync(source_folder + '/assets/scss/_fonts.scss');
    if (file_content == '') {
        fs.writeFile(source_folder + '/assets/scss/_fonts.scss', '', cb);
        return fs.readdir(path.build.fonts, function (err, items) {
            if (items) {
                let c_fontname;
                for (var i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if (c_fontname != fontname) {
                        fs.appendFile(source_folder + '/assets/scss/_fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                    }
                    c_fontname = fontname;
                }
            }
        })
    }
}

function cb() {

}

function watchFiles() {
    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.js], js);
    gulp.watch([path.watch.img], images);
}

function clean() {
    return del(path.clean);
}

const build = gulp.series(clean, gulp.parallel(js, css, html, images, fonts), fontsStyle);
const watch = gulp.parallel(build, watchFiles, browserSync);

exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;