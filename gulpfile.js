
//Модули 
var gulp = require('gulp');
var jade = require('gulp-jade');
var sass = require('gulp-sass');
var autoprefixer = require('autoprefixer');
var gcmq = require('gulp-group-css-media-queries');
var spritesmith = require('gulp.spritesmith');
var fs = require('fs');
var browserSync = require('browser-sync');
var reload      = browserSync.reload;
var postcss = require('gulp-postcss');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var prettify = require('gulp-js-prettify');
var rimraf = require('rimraf');
var color_rgba_fallback = require('postcss-color-rgba-fallback');
var opacity = require('postcss-opacity');
var vmin = require('postcss-vmin');
var pixrem = require('pixrem');
var svgSprite = require('gulp-svg-sprite'),
  svgmin = require('gulp-svgmin'),
  cheerio = require('gulp-cheerio'),
  replace = require('gulp-replace');
var filter    = require('gulp-filter');
var svg2png   = require('gulp-svg2png');

//Пути к файлам и папкам проекта

var srcRootPath = 'src';
var buildRootPath = 'build';
var pre_buildRootPath = 'pre_build';

var path = {
  build: {
    html: buildRootPath + '/',
    js: buildRootPath + '/js/',
    style: buildRootPath + '/style/',
    img: buildRootPath + '/img/',
    fonts: buildRootPath + '/fonts/'  
  },
  pre_build: {
    html: pre_buildRootPath + '/',
    js: pre_buildRootPath + '/js/',
    style: pre_buildRootPath + '/style/',
    img: pre_buildRootPath + '/img/',
    fonts: pre_buildRootPath + '/fonts/'  
  },
  src: {
    jade: {
      folder: srcRootPath + '/',
      files: srcRootPath + '/*.jade'
    }, 
    sass: {
      folder: srcRootPath + '/style/',
      files: srcRootPath + '/style/*.+(scss|sass)',
      template: srcRootPath + '/style/_template/'
    },
    css: srcRootPath + '/style/*.css',
    sprite: {
      folder: srcRootPath + '/sprite/',
      files: srcRootPath + '/sprite/*.png'
    },
    fonts: srcRootPath + '/fonts/*.*',
    js: srcRootPath + '/js/*.js',
    img: {
      folder: srcRootPath + '/img/',
      files: srcRootPath + '/img/*.*'
    },
    svg_sprite: srcRootPath + '/svg_sprite/*.svg',

  },
  watch: {
    jade: srcRootPath + '/**/*.jade',
    sass: srcRootPath + '/style/**/*.+(scss|sass)',
    css: srcRootPath + '/style/**/*.css',
    sprite: srcRootPath + '/sprite/*.png',
    fonts: srcRootPath + '/fonts/*.*',
    js: srcRootPath + '/js/*.js',
    img: srcRootPath + '/img/*.*',
    svg_sprite: srcRootPath + '/svg_sprite/*.svg'
  }

};
//конфиг сервера
var server_config = {
    server: {
        baseDir: pre_buildRootPath
    },
    port: 3000,
    logPrefix: "morhant_project",
    notify: false
};
// Задачи гальпа
//запуск сервера с авто релоадом
gulp.task('browser-sync', function () {
  browserSync.init(server_config);
});

// постпроцессоры css
var processors = [ 
  autoprefixer({browsers: ['last 5 versions', 'safari 5', 'ie 7','ie 8', 'ie 9', 'opera 12.1']}),
  color_rgba_fallback,
  opacity,
  vmin,
  pixrem,
  gcmq
  ];

gulp.task('css', function () {  
  return gulp.src(path.pre_build.style + '*.css')
    .pipe(postcss(processors))
    .pipe(gulp.dest(path.pre_build.style))
    .pipe(reload({stream:true}));  
}); 

// препроцессор css
gulp.task('sass', function () {
    return gulp.src(path.src.sass.files)
    .pipe(sass({indentedSyntax: true}).on('error', sass.logError))
    .pipe(gulp.dest(path.pre_build.style))
    
    //reload({stream:true});   
});

////////////////////////////////
function log(error) {
    console.log([
        '',
        "----------ERROR MESSAGE START----------",
        ("[" + error.name + " in " + error.plugin + "]"),
        error.message,
        "----------ERROR MESSAGE END----------",
        ''
    ].join('\n'));
    this.end();
}
//////////////////////////////

// препроцессоры  html
gulp.task('jade', function() {
   return gulp.src(path.src.jade.files)
        .pipe(jade({pretty: true}).on("error", log)) 
        .pipe(gulp.dest(path.pre_build.html))
        .pipe(reload({stream:true}));
});

//Спрайты

gulp.task('sprite', function () {
  var spriteData = gulp.src(path.src.sprite.files)
  .pipe(spritesmith({
    //retinaSrcFilter: '*-2x.png',
    //retinaImgName: 'sprite-2x.png',
    imgName: 'sprite.png',
    cssName: 'sprite.sass',
    padding: 2,
    imgPath: '../img/sprite.png'

  }))
  spriteData.img.pipe(gulp.dest(path.src.img.folder))
  spriteData.css.pipe(gulp.dest(path.src.sass.template))
    
  .pipe(reload({stream:true}));
 
});
//Картинки
gulp.task('img', function () {
    gulp.src(path.src.img.files) //Выберем наши картинки
        .pipe(imagemin([ 
          imagemin.gifsicle({interlaced: true}),
          imagemin.jpegtran({progressive: true}),
          imagemin.optipng({optimizationLevel: 3}),
          imagemin.svgo({
    plugins: [
      {removeViewBox: false},
      {cleanupIDs: false}
    ]
  })
        ]))
        .pipe(gulp.dest(path.pre_build.img)) //И бросим в build
        .pipe(reload({stream: true}));
});
//Красивый js
gulp.task('prettify', function() {
  gulp.src(path.src.js)
    .pipe(prettify({collapseWhitespace: true}))
    .pipe(gulp.dest(path.pre_build.js)) // edit in place
    .pipe(reload({stream: true})); 
});
//шрифты
gulp.task('fonts', function() {
    gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.pre_build.fonts))
        .pipe(reload({stream:true}));
});

//копируем css из src
gulp.task('copy_css', function() {
    gulp.src(path.src.css)
        .pipe(gulp.dest(path.pre_build.style))
        .pipe(reload({stream:true}));
});
/// шаблон svg sprite
gulp.task('svg_template_scss', function(cb){
  var svg_template = '.svg-icon \r\n\
  display: inline-block\r\n\
  height: 1em\r\n\
  width: 1em\r\n\
  font-size: inherit\r\n\
  fill: currentColor\r\n\
\r\n\
{{#shapes}}\r\n\
.svg-icon-{{base}}\r\n\
   width:({{width.inner}}/{{height.inner}})*1em\r\n\
\r\n\
{{/shapes}}';
  fs.writeFile(path.src.sass.template + 'svg_sprite_template.scss', svg_template, cb);
////  
});
gulp.task('svg_template_jade', function(cb){
  var jade_sprite_mixin = "mixin svg-icon(name,mod)\r\n\
  - mod = mod || ''\r\n\
  svg(class='svg-icon svg-icon-' + name + ' ' + mod)\r\n\
    use(xlink:href='img/svg-icons.svg#' + name)";
  fs.writeFile(srcRootPath + '/_template/svg_sprite_mixin.jade', jade_sprite_mixin, cb);
});
gulp
////svg sprite
gulp.task('svg_sprite', function () {
  return gulp.src(path.src.svg_sprite)
  // minify svg
    .pipe(svgmin({
      js2svg: {
        pretty: true
      }
    }))
    // remove all fill, style and stroke declarations in out shapes
    .pipe(cheerio({
      run: function ($) {
        $('[fill]').removeAttr('fill');
        $('[stroke]').removeAttr('stroke');
        $('[style]').removeAttr('style');
      },
      parserOptions: {xmlMode: true}
    }))
    // cheerio plugin create unnecessary string '&gt;', so replace it.
    .pipe(replace('&gt;', '>'))
    // build svg sprite
    .pipe(svgSprite({
      mode: {
        symbol: {
          sprite: "../img/svg-icons.svg",
          render: {
            scss: {
              dest: '../../src/style/svg_sprite',
              template: "src/style/_template/svg_sprite_template.scss"
            }
          }
        }
      }
    }))
    .pipe(gulp.dest(pre_buildRootPath))
    .pipe(reload({stream:true}));
});

//Очистка

gulp.task('clean', function (cb) {
    rimraf(pre_buildRootPath+'/', cb);
});
//Компиляция в реальном времени

gulp.task('watch', function () {
  gulp.start('browser-sync');
  gulp.watch(path.watch.jade, ['jade']);
  gulp.watch(path.watch.sass, ['sass']);
  gulp.watch(path.pre_build.style + '*.css', ['css']);
  gulp.watch(path.watch.sprite, ['sprite']);
  gulp.watch(path.watch.img, ['img']);
  gulp.watch(path.watch.js, ['prettify']);
  gulp.watch(path.watch.fonts, ['fonts']);
  gulp.watch(path.watch.css, ['copy_css']);
  gulp.watch(path.watch.svg_sprite, ['svg_sprite']);
});

function runSequential( tasks ) {
    if( !tasks || tasks.length <= 0 ) return;

    const task = tasks[0];
    gulp.start( task, () => {
        console.log( `${task} finished` );
        runSequential( tasks.slice(1) );
    } );
  }
//предварительный билд
 gulp.task( "pre_build", () => runSequential([ 'svg_template_scss', 'svg_template_jade', 'svg_sprite', "sprite", "jade", "sass", "img", "prettify", "fonts", "copy_css", "css" ]));

