// UNCLASSIFIED

/**
 * @module reader
 * @public
 * @requires base
 * @requires node-xlsx
 * @requires jsdom
 * @requires fs
 * @requires xml2js
 * @requires unoconv
 * @requires htmlparser
 * @requires office
 * @requires pdf2json
 * @requires yql
 * @requires natural
 * @requires teacher
 */

var 
	// globals
	ENV = process.env,
	SLASH = "/",
	DOT = ".",

	// nodejs bindings
	FS = require('fs'),			// File system

	// totem
	//HACK = require('geohack'), 			// chipper+detector workflow

	// 3rd party
	EXCEL = require('node-xlsx'),			// Excel parser
	JSDOM = require('jsdom'),				// Web site crawler	
	//XMLP = require("htmlparser"),			// HTML parser
	//OO = require('office'),				// Open Office parser
	XML2JS = require('xml2js'), 	// XML2JS reader	
	PDFP = require('pdf2json/pdfparser'), 	// PDF parser
	YQL = require('yql'),					// Cooperating site scrapper
	NLP = require('natural'),				// Natural Language Parsing (Bayes or Logireg)
	LDA = require('lda'), 					// NLP (via Latent Dirichlet Allocation)
	SPELL = require('teacher'),				// Spell checker 
	XML2JS = require("xml2js"),					//< xml to json parser 	
	UNO = require('unoconv'); 				// File converter/reader

var 										// totem bindings
	READ = module.exports = {
		//idop	: idop_Reader,
		xlsx	: xlsx_Reader,	
		text	: txt_Reader,	
		html	: html_Reader,
		yql		: yql_Reader,
		odt		: ood_Reader,
		odp		: oop_Reader,
		ods		: oos_Reader,
		pdf		: pdf_Reader,
		jpg		: jpg_Reader,
		xml		: xml_Reader,
		//py		: py_Reader,
		//js		: js_Reader,
		//db		: db_Reader,
		//jade	: jade_Reader,
		config	: config_Reader,
		reader	: Reader,
		enabled : true,
		trace 	: false,
		classif	: ENV.READER		// Use Bayes classifier.  Logireg also possible.  LDA not support
					? NLP.BayesClassifier.restore(JSON.parse(FS.readFileSync(ENV.READER)))
					: new NLP.BayesClassifier(),
		minTextLen : 10,				// Min text length to trigger indexing
		minReadability : -9999,			// Min readability score to trigger NLP
		minRelevance: 0.0, 				// Min NLP relevance to tripper intake
		spellRubric: {
			"spelling": 3,
			"suggestion": 1,
			"grammar": 2
		}
	};

const { Copy,Each,Log } = require("enum");

function config_Reader (sql) {
	sql.query('SELECT * FROM app1.nlprules WHERE Enabled')
	.on('error', function (err) {
		console.info('Cant get NLP rule - '+err);
	})
	.on('result', function (rule) {
		READ.classif.addDocument(rule.Usecase.toUpperCase(), rule.Index);
	})
	.on('end', function () {
		READ.classif.train();
		
		if (READ.trace) {
			var Trials = [
				'Windows 64 bit is a fine Operating System',
				'i would like a circular polarized beam please',
				'this algorithm is still highly experimental',
				'i need more hyperspectral data'];
			
			READ.each(Trials, function (n,trial) {
				console.info(trial+" -> ");
				console.log(READ.classif.getClassifications(trial));
			});
		}
		
		READ.idxs = READ.classif.getClassifications("test");
		console.log(READ.idxs);
		
		if(ENV.READER)
			READ.classif.save(ENV.READER, function(err, classifier) {
				if (err) 
				console.info('Cant save NLP trainging state - '+err);
			});			
	});
}

/*
function db_Reader(sql,path,cb) {
	sql.query("SELECT * FROM ??", path, function (recs) {
		cb(JSON.stringify(recs));
	});
} */

function jpg_Reader(sql,path,cb) {		
}

function xlsx_Reader(sql,path,cb) {
	var 
		sheets = EXCEL.parse(path),
		recs = [];
	
	if (sheets)
		sheets.forEach( function (sheet, n) {  // sheet - no formulas allowed
			var 
				vars = new Array(sheet.maxCol),
				data = sheet.data;

			data.forEach( function (row, j) {
				var
					rec = new Object({ID:j, sheet: sheet.name});

				if ( j ) {
					recs.push(rec);
					row.forEach( function (cell, i) {
						rec[vars[i]] = cell;
					});
				}
				
				else   // 1st record is the header containing field names
					row.forEach( function (cell, i) {
						vars[i] = cell;
					});
			});
		});
	
	cb(recs);
}

function txt_Reader(sql,path,cb) {
	try {
		cb( FS.readFileSync(path,'utf8') );
	} catch (err) {};
}

/*
function py_Reader(sql,path,cb) {
	try {
		sql.query("UPDATE engines SET ? WHERE least(?)",[
				{Code:FS.readFileSync(path,'utf8')},
				{Name:job, Engine:"python"}]);
	} catch (err) {};
}

function js_Reader(sql,path,cb) {
	try {
		sql.query("UPDATE engines SET ? WHERE least(?)",[
				{Code:FS.readFileSync(path,'utf8')},
				{Name:job, Engine:"js"}]);
	} catch (err) {};
			
}

function jade_Reader(sql,path,cb) {
	try {
		sql.query("UPDATE engines SET ? WHERE least(?)",[
				{Code:FS.readFileSync(path,'utf8')},
				{Name:job, Engine:"jade"}]);
	} catch (err) {};
			
}
*/

function oop_Reader(sql,path,cb) {	
}

function oos_Reader(sql,path,cb) {	
	UNO.convert(path, "ooxml", {output:ENV.PUBLIC+"tmp/"+path}, function (err,data) {
		FS.readFile(ENV.PUBLIC+"tmp/"+path, 'utf-8', function (err,data) {
			XML2JS.parseString(data, function (err,json) {
//console.log(json);
				READ.each(json["Workbook"]["ss:Worksheet"], function (n,sheet) {
console.log(sheet);
				READ.each(sheet["Table"], function (n,table) {
					if (n==0) {
console.log(table);
						var col = table.Column, row = table.Row;
//console.log(row);
//console.log(col);
					}
				}); });
			});		
		});
	}); 
}

function ood_Reader(sql,path,cb) {	

	if (false) { 	// retains 1st image in folder=~/tmp
		var handler = new XMLP.DefaultHandler(function (error, dom) {
			var ELS = XMLP.DomUtils.getElements();
			var IMG = XMLP.DomUtils.getElementsByTagName("IMG", dom);
			var HTML = XMLP.DomUtils.getElementsByTagName("HTML", dom);
			var P = XMLP.DomUtils.getElementsByTagName("P", dom); //[0].children[0].raw;
		});
		OO.parse(path, {img:true}, function(err, filepath) {  // output=~/
			FS.readFile(filepath, 'utf-8', function(err, data) {
				var parser = new XMLP.Parser(handler);
				parser.parseComplete(data);
			});
		});
	}
	else
	if (false) {  	// drop images (output to stdout)
		var handler = new XMLP.DefaultHandler(function (error, dom) {
			var ELS = XMLP.DomUtils.getElements();
			console.log("xmlp err="+error+" els="+ELS.length);

			var IMG = XMLP.DomUtils.getElementsByTagName("IMG", dom);
			console.log("IMG="+IMG);
			
			var HTML = XMLP.DomUtils.getElementsByTagName("HTML", dom);
			console.log("HTML=");
			console.log(HTML);
			
			var P = XMLP.DomUtils.getElementsByTagName("P", dom); //[0].children[0].raw;
			console.log("P=");
			//console.log(P);
		});
			
		OO.parse(path, function(err, data) {
			var parser = new XMLP.Parser(handler);
			parser.parseComplete(data);			
		});	
	}		
	else 			// use ooxml (UNO has problems with xml)  retains 1st image in public/tmp
		UNO.convert(path, "ooxml", {output:ENV.PUBLIC+"tmp/"+path}, function (err,data) {
			FS.readFile(ENV.PUBLIC+"tmp/"+path, 'utf-8', function (err,data) {
				XML2JS.parseString(data, function (err,json) {
					READ.each(json["w:wordDocument"]["w:body"], function (n,body) {
					READ.each(body["w:p"], function (n,para) {
					READ.each(para["w:r"], function (n,recd) {
					READ.each(recd["w:t"], function (n,text) {
						cb({Text: text});
					}); }); }); });
				});					
			});
		}); 
}

function xml_Reader(sql,path,cb) { 
	FS.readFile(path,'utf-8', function (err,data) {
		XML2JS.parseString(data, function (err,json) {
			for (var n in json) console.log(json);
		});
	});
}

function pdf_Reader(sql,path,cb) {
	console.log("pdfrdr");
				
	var PDF = new PDFP();
						
	PDF
	.on("pdfParser_dataReady", function(evtData) {
		console.log(evtData);
		
		if ((!!evtData) && (!!evtData.data))  {
			var npages=evtData.data.Pages.length;
			var text = "";

			Each(evtData.data.Pages, function (pn,page) {
				Each(page.Texts, function (tn,txt) {
					Each(txt.R, function (rn,report) {
						text += unescape(report.T)+" ";
					});
				});
			});

			console.log("PDF INGESTED "+npages+" pages "+text.length+" chars");
				
			cb(text);
		}
	})
	.on("pdfParser_dataError", function(evtData) {
		console.log("PDF ERROR "+evtData.data);
	});
	
	console.log("pdf="+path);
	console.log(PDF.loadPDF);
	//PDF.loadPDF(path);
}

function html_Reader(sql,path,cb) {
	
	function reportify(File,Post) {
		var Xlate = {
			AR: "State0", 	// advisory
			PR: "State1",	// test plan
			RR: "State2",	// test readiness
			TR: "State3",	// test report
			UR: "State4",	// user review
			ER: "State5", 	// independent eval
			MR: "State6",	// memo of understanding
			DR:	"State7",	// developers report
			OR:	"State8",	// operational test & eval
			SR: "State9"	// security report
		};
		
		if (!File) return Xlate[Post];
		
		var Script = "JAVASCRIPT:";
		var Query = File.toUpperCase().split("?");
		var Parms = (Query.length>1) ? Query[Query.length-1] : "";
		var Names = Query[0].split("/");
		var Parts = Names[Names.length-1].split(".");
		var Name = unescape(Parts[0]);
		var Type = (Parts.length>1) ? Parts[Parts.length-1] : "";
		var Report = Post;
		
		if (Query[0].substr(0,Script.length) == Script) return null;
		
		switch (Type) {
			case "PHP":		// ignore things that dont look like relevant files
			case "HTM":
			case "HTML":
			case "INTEL":
			case "ASP":
			case "ASPX":
				Report = Parms.has("DOCUMENTID=") ? "DR" : null;
				break;
				
			case "PDF":		// relevant files
			case "DOC":	
			case "DOCX":
			case "TXT":
			case "XLS":
			case "XLSX":
			case "":
			
				if (Parms) return null;
				if (!Name) return null;
				
				var isTest = Name.has("TEST");
				var isPlan = Name.has("PLAN") && isTest;
				var isBogus = File.has("/PEOPLE") || Name.has(":");
				var isReport = isTest && !isPlan;
				var isReady = Name.has("ASSESS") || Name.has("READY") || Name.has("READI") || Name.has("EVAL");
				var isEval = Name.has("VERIF") || Name.has("V&V");
				var isOper = Name.has("OPER") || File.has("/WIKI");
				
				if (isBogus) 	Report = null;
				else
				if (isPlan)		Report = "PR";	
				else
				if (isReady)	Report = "RR";
				else
				if (isEval)		Report = "ER";
				else
				if (isReport)	Report = "TR";
				else
				if (isOper)		Report = "OR";
				
				break;
			
			default:
			
				break;
		}
		
		return Report ? Xlate[Report] : null;
	}
	
	sql.query("SELECT * from engines WHERE least(?)",{Name:path, Engine:"html"})
	.on("result", function (eng) {
		var Site = eng.Path, Table = job;
		var rec = {ID:0};
		var filter = eng.Code ? JSON.parse(eng.Code) : null;

		console.info("Queueing "+rec.Path);

		JSDOM.env({
			file	: Site,					// Site that supplies the DOM
			scripts	: [ENV.SCAN],			// Add jQuery & Scanner to the DOM
			done	: function (err, window) {
				var $ = window ? window.$ : null;
				var site = window ? window.location.href : "";
				
				//console.info("SCAN site "+site+" $="+($?true:false)+" err="+err);
				
				if (site && $ && !err) {	// scan valid and matched site
					sql.query("SELECT * FROM proxies WHERE LEAST(?) LIMIT 0,1",{Path:site.replace("file://",""),Enabled:true})
					.on("result", function (proxy) {
						console.info("SCANNING "+Site+":"+Table);
						
						var ids = {0: false},
							path = proxy.Name;
						
						$("body").find("table."+Table).each( function () {
							$("table",this).each( function () {	// remove nested tables
								//console.log("SCAN removed nested table");
							}).remove();
							
							if ($("caption",this).length) 
								rec.Caption = $("caption",this).first().text();
								
							$("tr",this).each( function (tr) {	// derive column ids and data
								var cols = $("td",this).length;

								if (ids["0"]) {	// columns defined so go get data
									$("td",this).each( function (td) {	
										id = (cols==1) ? "info" : ids[td];
											
										if (filter ? filter[id] : true) 
											rec[id] = $(this).text();

										$("a",this).first().each( function () {	// todo reportify path
											if (filter ? filter[id] : true) 
												rec[id] += "<a href='" + $(this).attr("href") + "'>" + path + "</a>";
										});
									});
									
									cb(rec);	// retain record
								}
								else {
									$("th",this).each( function (th) {  // use header row for ids if provided
										ids[th] = $(this).text().has(args);
									});
									
									if (!tr && !ids["0"]) // 1st row gives ids if no header row provided
										$("td",this).each( function (td) {
											ids[td] = $(this).text().has(args);
										});
								}
							});	
						});
					});
				}
				else 
					console.log("http reader error: "+err);
			}
		});
	});
}

function yql_Reader(sql,path,cb) { 
	var 
		select = req.param('select'),
		from = req.param('from'),
		where = req.param('where'),
		query = "select "+select+" from "+from+" where "+where.replace(/\\/g,"/");

	console.info(UTIL.format("%s %s",req.method,query));

	new YQL.exec(query, function (recs) {
		console.info(recs);
		READ.each( recs, function (n,rec) {
			cb(rec);
		});
	});
}

/*
function idop_Reader(sql,path,cb) {	
	// area contains parms and is used to start the swag workflow
	var env = process.env,
		parms = {
			size: parseFloat(env.SIZE),
			pixels: parseInt(env.PIXELS),
			scale: parseFloat(env.SCALE),
			step: parseFloat(env.STEP),
			range: parseFloat(env.RANGE),
			detects: parseInt(env.DETECTS),
			infile: path,
			outfile: ""
		};
		
	HACK.workflow(sql, parms, function (chip,dets) {
		cb(dets);
	}); 
}
*/

function Reader(sql,path,cb) {
	console.log("reader");
	
	var parts = path.split("."),
		type = parts.pop(),
		keys = {
			Classif: "(U)",
			Readability: 100
		};

	Each(READ.idxs, function (n,idx) {
		keys[idx.label] = 0;
	});
	
	if (read = READ[type])
		read(sql, path, function (text) {
			console.log("text="+text);
			/*text.indexor(keys, function () {
				if (cb) cb(keys);
			});*/
		});
	
}
	
[
	function cleaner() {	
		return this
				.toUpperCase()
				.replace(/\t/gm,"")
				.replace(/^#*/gm,"")
				.replace(/\n/gm," ")
				.replace(/<BR>/g," ")
				.replace(/\&NBSP;/g," ")
				.replace(/,/g,".")
				.replace(/:/g,".")
				.replace(/;/g,".")
				.replace(/ AND /g,".")
				.replace(/ OR /g,".")
				.replace(/ THEN /g,".")
				.replace(/ IF /g,".")
				.replace(/ BECAUSE /g,".")
				.replace(/ WHEN /g,".")
				.replace(/  /g," ");
	},

	function splitter() {
		return this.match( /[^\.!\?]+[\.!\?]+/g );
	},

	function indexor(score,cb) {
		var rubric = READ.spellRubric,
			classify = READ.classif,
			text = this+"";

		if (text.length > READ.minTextLen)
			SPELL.check( text, function (err,checks) {

				if (!checks || err) checks = [];

				READ.each(checks, function (n,check) {
					score.Readability -= rubric[check.type];
				});

				//console.log([text, score.Readability, READ.minReadability]);

				if (score.Readability > READ.minReadability)
					text.splitter().each( function (n,frag) {
						//console.log([n,frag]);

						if (frag) 								// discard empties
							if (frag.indexOf("<") < 0) 			// discard html (yes - a stupid filter)
								classify.getClassifications(frag).each( function (m,idx) {
									//console.log([frag,idx.value,idx.label,READ.minRelevance]);
									if (idx.value > READ.minRelevance) 		// discard irrelevant
										score[idx.label] += idx.value;
								});
					});

				cb();
			});
	}
].extend(String);
		
// UNCLASSIFIED
