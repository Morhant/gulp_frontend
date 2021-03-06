
//Modules
var gulp = require('gulp');
var jade = require('gulp-jade');
var sass = require('gulp-sass');
var autoprefixer = require('autoprefixer');
var mqpacker = require('css-mqpacker');
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

//Path to folders and files of project
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
      dir: srcRootPath + '/',
      files: srcRootPath + '/*.jade',
      template: srcRootPath + '/_template/'
    }, 
    sass: {
      dir: srcRootPath + '/style/',
      files: srcRootPath + '/style/*.+(scss|sass)',
      template: srcRootPath + '/style/_template/'
    },
    css: srcRootPath + '/style/*.css',
    sprite: {
      dir: srcRootPath + '/sprite/',
      files: srcRootPath + '/sprite/*.png'
    },
    fonts: {
      files: srcRootPath + '/fonts/*.*',
      dir: srcRootPath + '/fonts/'
    },
    js: {
      files: srcRootPath + '/js/*.js',
      dir: srcRootPath + '/js/'
    }, 
    img: {
      dir: srcRootPath + '/img/',
      files: srcRootPath + '/img/*.*'
    },
    svg_sprite: {
      files: srcRootPath + '/svg_sprite/*.svg',
      dir: srcRootPath + '/svg_sprite/'
    }

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
//Configuration of BroserSync server
var server_config = {
    server: {
        baseDir: pre_buildRootPath
    },
    port: 3000,
    logPrefix: "morhant_project",
    notify: false
};
// Gulp Tasks
//Server with autoreloading
gulp.task('browser-sync', function () {
  browserSync.init(server_config);
});
// Configuration of PostCss task
var processors = [ 
  autoprefixer({browsers: ['last 5 versions', 'safari 5', 'ie 7','ie 8', 'ie 9', 'opera 12.1']}),
  color_rgba_fallback,
  opacity,
  vmin,
  pixrem,
  mqpacker({ sort: true })
  ];
// PostCss task
gulp.task('css', function () {  
  return gulp.src(path.pre_build.style + '*.css')
    .pipe(postcss(processors))
    .pipe(gulp.dest(path.pre_build.style))
    .pipe(reload({stream:true}));  
}); 
// Preprocessor sass
gulp.task('sass', function () {
    return gulp.src(path.src.sass.files)
    .pipe(sass({indentedSyntax: true}).on('error', sass.logError))
    .pipe(gulp.dest(path.pre_build.style))    
    //reload({stream:true});   
});
// Log error for Jade
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
//////////////////////
// Jade to HTML
gulp.task('jade', function() {
   return gulp.src(path.src.jade.files)
        .pipe(jade({pretty: true}).on("error", log)) 
        .pipe(gulp.dest(path.pre_build.html))
        .pipe(reload({stream:true}));
});
//PNG sprites
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
  spriteData.img.pipe(gulp.dest(path.src.img.dir))
  spriteData.css.pipe(gulp.dest(path.src.sass.template))    
  .pipe(reload({stream:true})); 
});
//Task for Images
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
//Beauty JavaScript
gulp.task('prettify', function() {
  gulp.src(path.src.js.files)
    .pipe(prettify({collapseWhitespace: true}))
    .pipe(gulp.dest(path.pre_build.js)) // edit in place
    .pipe(reload({stream: true})); 
});
//Fonts
gulp.task('fonts', function() {
    gulp.src(path.src.fonts.files)
        .pipe(gulp.dest(path.pre_build.fonts))
        .pipe(reload({stream:true}));
});

//Copy non sass | scss style files from crc
gulp.task('copy_css', function() {
    gulp.src(path.src.css)
        .pipe(gulp.dest(path.pre_build.style))
        .pipe(reload({stream:true}));
});
// Create SCSS template for SVG sprite
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
// Create mixin Jade file for SVG sprite 
});
gulp.task('svg_template_jade', function(cb){
  var jade_sprite_mixin = "mixin svg-icon(name,mod)\r\n\
  - mod = mod || ''\r\n\
  svg(class='svg-icon svg-icon-' + name + ' ' + mod)\r\n\
    use(xlink:href='img/svg-icons.svg#' + name)";
  fs.writeFile(srcRootPath + '/_template/svg_sprite_mixin.jade', jade_sprite_mixin, cb);
});
// SVG sprite. It makes mono colour svg icons
gulp.task('svg_sprite', function () {
  return gulp.src(path.src.svg_sprite.files)
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
// Clean pre_build folder
gulp.task('clean:pre_build', function (cb) {
    rimraf(pre_buildRootPath+'/', cb);
});
//Auto assambling project to pre_build in real time
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
// Function to start tasks one by one
function runSequential( tasks ) {
    if( !tasks || tasks.length <= 0 ) return;

    const task = tasks[0];
    gulp.start( task, () => {
        console.log( `${task} finished` );
        runSequential( tasks.slice(1) );
    } );
  }
// run pre_build
gulp.task( "pre_build", () => runSequential(['clean:pre_build', 'svg_template_scss', 'svg_template_jade', 'svg_sprite', "sprite", "jade", "sass", "img", "prettify", "fonts", "copy_css", "css" ]));

