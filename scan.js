/**
 * @class SCAN
 * WEB scanning / crawling interface
 */
 
var SCANlog = console.log;

function isArray(obj)	{ return (obj.constructor.toString().indexOf("Array")  >= 0) }
function isString(obj)	{ return (obj.constructor.toString().indexOf("String") >= 0) }
function isObject(obj)	{ return (obj.constructor.toString().indexOf("Object") >= 0) }

/**
 * @class Date
 * @method toJSON
 * @return {String} MySQL compliant version of this date
 */

Date.prototype.toJSON = function () {
	return this.toISOString().split(".")[0];
}

/**
 * @class String
 * @method has
 * @param {String/Array/Object} arg thing to find
 * @return {Null} True if this is empty.
 * @return {Object} Matched item found in arg Object or in arg Array.
 * @return {Boolean} True if this contains arg String.
 */
String.prototype.has = function(arg) { 
	if (!arg)
		return this ? true : false;
	else
	if (isObject(arg)) {
		var norm = this.toUpperCase();
		for (var k in arg)
			if (norm.has(k)) return arg[k];
			
		return false;
	}
	else
	if (isArray(arg)) {
		for (i=0; i<arg.length; i++) if (this==arg[i]) return arg[i]; 
		return false; 
	}
	else
	if (isString(arg))
		return this.indexOf(arg) >= 0;
	else
		return false;
}

/**
 * @class String
 * @method replaceAt
 * Replace char at specified position with specified value.
 * @param {Numeric} n position with this string
 * @param {String} val position with this string
 */
String.prototype.replaceAt = function (n,val) {
  return this.substr(0,n) + val + this.substr(n+1);
}

/**
 * @class String
 * @method clean
 * Return printable verision of this string.
 */
String.prototype.clean = function () {
	var Start,End,n,rtn="",printable=" abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ<,>.?/:;~`{[}]|\\1234567890!@#$%^&*()_-+"+'"';
	
	for (End=this.length-1;End>=0;End--) if (this[End]   != " ") break;
	for (Start=0;Start<=End;Start++) 	 if (this[Start] != " ") break;
	
	for (n=Start;n<=End;n++) if (printable.has(this[n])) rtn += this[n];
	
	return rtn;
}

String.prototype.normalize = function (fixes) {
	var rtn = this.clean().toUpperCase();
	
	// drop stuff that can be ignored
	
	for (var n=0;n<WEBstops.length;n++)
		if (rtn.indexOf(WEBstops[n]) >= 0)
			return "";
	
	// standardize terms
	
	if (fixes)
		fixes.each( function (n,fix) {
			if (fix.enabled) rtn = rtn.replace(fix.from,fix.to);
		});
	
	// remove nusance characters
	
	return " " + rtn
		.replace(/[-\/_()]/g," ")
		.replace(/^\s+|\s+$/g,"") + " ";
}

String.prototype.watch = function () {
	var arg = this.normalize();
	
	if (!arg) return "";
	
	// decide if its on the existing watch list
	
	for (var sys in WEBwatch) {			
		var alias = sys.toUpperCase().split("|");
			for (var i=0;i<alias.length;i++)
				if (arg.has(" "+alias[i]+" "))
					return sys;
	}
	
	// flag as new
	
	return "?" + arg;					
}

/**
 * @class jQuery
 * @method SCANlink
 * @param {String} $src source URL from whence this link originated.
 * @return {String} Html to represent this link
 */

jQuery.prototype.SCANlink = function ($src) {
	var href = "";
	
	$("a",this).first().each( function () {
		href = $(this).attr("href");
	});
	
	return href
			? ("<a href='" + href + "'>" + $src + "</a>")
			: ($src + ":" + $(this).text());
}

/**
 * @class jQuery
 * @method SCANlist
 * @param {String} $list html tag that introduces a list.
 * @param {String} $link html tag that introduces a file within a list.
 * @param {String} $cap html tag that introduces a table caption for dating links.
 * @param {String} $src source URL from whence this link originated.
 * @param {String} $tar link element being scanned.
 * @param {String} CB callback(link) called when link defined.
 */

jQuery.prototype.SCANlist = function ($list,$link,$cap,$src,$tar,CB) {
//SCANlog("list link="+$link);
	if ($list)
		this.find($list).each( function () {
			if ($link)
				$($link,this).each( function () {
					var Link = {_Source: $src, _Date: $cap, _Parse: $list};
					
					Link[$tar] = $(this).SCANlink($src);
					Link.Name = $(this).text();
					CB(Link);
				});
		}).remove();
	else
	if ($link)
		this.find($link).each( function () {
			var Link = {_Source: $src, _Date: $cap, _Parse: $list};
			Link[$tar] = $(this).SCANlink($src);
//SCANlog($src+"-->"+Link[$tar]);
			Link.Name = $(this).text();
			CB(Link);
		}).remove();
}

/**
 * @class jQuery
 * @method SCANtable
 * @param {String} $cap html tag that introduces a table's caption for dating links.
 * @param {String} $src source URL from whence this link originated. 
 * @param {String} $tar link element being scanned.
 * @param {String} CB callback(link) called when link defined.
 */

jQuery.prototype.SCANtable = function ($cap,$src,$tar,CB) {
	var Targets = new Object();
	
	this.find("table").each( function () {
	
		$("table",this).each( function () {
			SCANlog("SCAN removed nested table");
		}).remove();
		
		if ($("caption",this).length) 
			$cap = $("caption",this).first().text();
			
		$("tr",this).each( function (tr) {		
			if ($tar) {
				$("th",this).each( function (th) {
					Targets[th] = $(this).text().has($tar);
				}).remove();
				
				if (!tr && !Targets["0"]) // 1st row is header if header not provided
					$("td",this).each( function (td) {
						Targets[td] = $(this).text().has($tar);
					}).remove();
			}
			
			var Cols = $("td",this).length;
			var Link = {_Source: $src, _Date: $cap, _Parse: "table"};
			
			if (Targets["0"]) {
				$("td",this).each( function (td) {
				
					Target = Targets[td];
					
					if (Cols == 1) 
						Link.Name = $(this).text();
					else
					if (Target == "System")
						Link.Name = $(this).text();						
					else
					if (Target)
						if (!Link[Target])
							Link[Target] = $(this).SCANlink($src);
						else 
							Link[Target] += $(this).SCANlink("");					
				});
				CB(Link);
			}
			else
				SCANlog("SCAN skip noncoforming table");
		});
	}).remove();
}

/**
 * @class jQuery
 * @method SCANheader
 * @param {String} $cap html tag that introduces a header section.
 * @param {String} $src source URL from whence this link originated. 
 * @param {String} $tar link element being scanned.
 * @param {String} CB callback(link) called when link defined.
 */

jQuery.prototype.SCANheader = function ($cap,$src,$tar,CB) {
	if ($tar) {
		if (isObject($tar))
			this.SCANtable($cap,$src,$tar,CB);
		else
		if (isArray($tar)) {
		}
		else
		if (isString($tar)) {
			this.find("table").remove();
			this.SCANlist("dl","dt a",$cap,$src,$tar,CB);
			this.SCANlist("ul","li a",$cap,$src,$tar,CB);
			this.SCANlist(null,"a",   $cap,$src,$tar,CB);
		}
	}
}

/**
 * @class jQuery
 * @method SCANpage
 * @param {String} $header html tag that introduces a header section.
 * @param {String} $tar link element being scanned.
 * @param {String} $src source URL from whence this link originated. 
 * @param {String} CB callback(link) called when link defined.
 */

jQuery.prototype.SCANpage = function ($header,$tar,$src,CB) {
	SCANlog("tar="+$tar+" hdr="+$header);
	
	if ($header) {
		var Head = this.find($header);
		while (Head.length) {		
			var $cap = Head.find("span").last().text();
			if (!$cap) $cap = new Date();
			
			this.SCANheader($cap,$src,$tar,CB);
			
			Head.remove();
			Head = this.find($header);
		};
	}
	else {
		this.SCANheader(new Date(),$src,$tar,CB);
	}
}

jQuery.prototype.SCANinit = function (console) {
	SCANlog = console.log;
	SCANlog("console defined");
}

jQuery.prototype.SCAN_table = function (name) {
	$("table",this).each( function () {
	
		$("table",this).each( function () {
			SCANlog("SCAN removed nested table");
		}).remove();
		
		if ($("caption",this).length) 
			$cap = $("caption",this).first().text();
			
		$("tr",this).each( function (tr) {	// derive column names and data
			if ($tar) {
				$("th",this).each( function (th) {  // use header columns if provided
					Targets[th] = $(this).text().has($tar);
				}).remove();
				
				if (!Targets["0"]) // 1st row is header if header not provided
					$("td",this).each( function (td) {
						Targets[td] = $(this).text().has($tar);
console.log("def col["+td+"]="+$(this).text());
					}).remove();
			}
			
			var Cols = $("td",this).length;
			var Link = {_Source: $src, _Date: $cap, _Parse: "table"};
			
			if (Targets["0"]) {
				$("td",this).each( function (td) {
				
					Target = Targets[td];
					
					if (Cols == 1) 
						Link.Name = $(this).text();
					else
					if (Target == "System")
						Link.Name = $(this).text();						
					else
					if (Target)
						if (!Link[Target])
							Link[Target] = $(this).SCANlink($src);
						else 
							Link[Target] += $(this).SCANlink("");					
				});
				CB(Link);
			}
			else
				SCANlog("SCAN skip noncoforming table");
		});
	}).remove();	
}

