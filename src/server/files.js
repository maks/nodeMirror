/*
  low level dirRead / fileReadWrite implementation
*/
define([
  "dojo/_base/declare"
  , "dojo/Deferred"
  , "dojo/node!fs"
  , "dojo/_base/array"
  , "dojo/promise/all"
  , "dojo/_base/lang"
  , "sol/promise"
  , "dojo/node!mime-magic"
  , "dojo/node!mime"
  , "sol/string"
], function(
  declare
  , Deferred
  , fs
  , array
  , all
  , lang
  , solPromise
  , mimeMagic
  , mime
  , solString
){
  
  var customExtensions = {
    ".pl": "application/promiseLand" 
    , ".pegjs": "application/peg.js" 
    , ".less": "text/x-less"
  };

  var forceTextExtensions = {
    ".pl": "application/promiseLand" 
    , ".pegjs": "application/peg.js" 
    , ".less": "text/x-less"
  };
  
  var files;
  var Files = declare("File", [
    
  ], {
    remoteFunctions: {
	}
    , dirsDef: function(parFileName){
      var def = new Deferred();
      fs.stat(parFileName, function(err, stat){
        if (err || !stat.isDirectory()){
          def.resolve();
          return;
        };
        fs.readdir(parFileName, function(err, parFiles){
          if (err){
            def.resolve();
            return;
          };
          var resultAr = [];
          solPromise.allDone(array.map(parFiles, function(file){
            filename = parFileName + "/" + file;
            return files.isDirDef(filename).then(function(filename){
              resultAr.push(filename);
            }); //function(){ resultAr.push(filename); });
          })).then(function(){
            def.resolve(resultAr);
          });
        });
      });
      return def.promise;
    }
    , childrenDef: function(parFileName){
      var def = new Deferred();
      files.isDirDef(parFileName).then(function(){
        fs.readdir(parFileName, function(err, parFiles){
          if (err){
            def.resolve();
            return;
          };
          def.resolve(array.map(parFiles, function(file){
            return parFileName + "/" + file;
          }));
        });
      }, function(){
        def.resolve();
      });
      return def.promise;
    }
    , isDirDef: function(parFileName){
      var def = new Deferred();
      fs.stat(parFileName, function(err, stat){
        if (err){
          console.log(err);
          def.reject(parFileName);
          return;
        };
        if (stat.isDirectory()){
          def.resolve(parFileName);
        };
        def.reject(parFileName);
      });
      return def.promise;
    }
    
    , contentTypeDef: function(parFileName){
      var def = new Deferred();
      var result = {};
      mimeMagic(parFileName, function (err, type) {
        if (err) {
          def.reject(err);
          return;
        };
        fs.stat(parFileName, function(err, stats){
          try{
            if (err) {
              def.reject(err);
              return;
            };
          var isEmpty = false;
          if (!stats.isDirectory() && stats.size === 0){
            isEmpty = true;
          };
          if (type == "inode/x-empty"){
            isEmpty = true;
          };
            var extension;
          if (type == "text/plain" || isEmpty){
            for (extension in customExtensions){
              if (parFileName.substr(parFileName.length - extension.length) == extension){
                type = customExtensions[extension];
                def.resolve(type);
                return;
              };
            };
            type = mime.lookup(parFileName);
          }else if(solString.startsWith(type, "text/")){
            for (extension in forceTextExtensions){
              if (solString.endsWith(parFileName, extension)){
                type = customExtensions[extension];
                def.resolve(type);
                return;
              };
            };
          };
            def.resolve(type);
          }catch(e){
            console.log("error");
            console.log(e);
          };
        });
      });
      return def.promise;
    }
    
    , readTextDef: function(parFileName){
      var def = new Deferred();
      fs.readFile(parFileName, {encoding: "utf8"}, function(err, data){
        if (typeof data == "object"){
          def.resolve(data.toString());
        }else if (typeof data == "string"){
          def.resolve(data);
        }else{
          def.resolve("file could not be read");
        };
      });
      return def.promise;
    }
    
    , createFileDef: function(parFileName){
      var def = new Deferred();
      fs.open(parFileName, "a", undefined, function(err, fd){
        if (err){
          console.log(err);
          def.reject(err);
          return;
        };
        if (fd){
          fs.close(fd, function(){
            def.resolve();
          });
          return;
        };
        def.resolve();
      });
      return def.promise;
    }
    
    , createDirDef: function(parDirName){
      var def = new Deferred();
      fs.mkdir(parDirName, undefined, function(err){
        if (err){
          def.reject(err);
        }else{
          def.resolve(parDirName);
        };
      });
      return def.promise;
    }
    
    , writeTextDef: function(parFileName, parText){
      var def = new Deferred();
      fs.writeFile(parFileName, parText, {encoding: "utf8"}, function(err, data){
        console.log(parFileName);
        console.log(data);
        def.resolve();
      });
      return def.promise;
    }
    
  });
  files = new Files();
  return files;
});
