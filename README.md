# [READER](https://www.npmjs.com/package/@totemorg/reader)

Index (parse, scrape, etc) a variety of document, graphics, presentation, and spreadsheet files 
that were uploaded into Totem,  Ingested text is checked for readibility, indexed to the best using 
[NLP training rules](/nlprules.view), then reflected into the [file stores](/files.view).

## Suport File Types

### WEB files

	html	- Web site
	rss		- News feed
	idop	- NTM imagery
		
### Document files

	bib      - BibTeX [.bib]
	doc      - Microsoft Word 97/2000/XP [.doc]
	doc6     - Microsoft Word 6.0 [.doc]
	doc95    - Microsoft Word 95 [.doc]
	docbook  - DocBook [.xml]
	docx     - Microsoft Office Open XML [.docx]
	docx7    - Microsoft Office Open XML [.docx]
	fodt     - OpenDocument Text (Flat XML) [.fodt]
	html     - HTML Document (OpenOffice.org Writer) [.html]
	latex    - LaTeX 2e [.ltx]
	mediawiki - MediaWiki [.txt]
	odt      - ODF Text Document [.odt]
	ooxml    - Microsoft Office Open XML [.xml]
	ott      - Open Document Text [.ott]
	pdb      - AportisDoc (Palm) [.pdb]
	pdf      - Portable Document Format [.pdf]
	psw      - Pocket Word [.psw]
	rtf      - Rich Text Format [.rtf]
	sdw      - StarWriter 5.0 [.sdw]
	sdw4     - StarWriter 4.0 [.sdw]
	sdw3     - StarWriter 3.0 [.sdw]
	stw      - Open Office.org 1.0 Text Document Template [.stw]
	sxw      - Open Office.org 1.0 Text Document [.sxw]
	text     - Text Encoded [.txt]
	txt      - Text [.txt]
	uot      - Unified Office Format text [.uot]
	vor      - StarWriter 5.0 Template [.vor]
	vor4     - StarWriter 4.0 Template [.vor]
	vor3     - StarWriter 3.0 Template [.vor]
	xhtml    - XHTML Document [.html]
### Graphics files

	bmp      - Windows Bitmap [.bmp]
	emf      - Enhanced Metafile [.emf]
	eps      - Encapsulated PostScript [.eps]
	fodg     - OpenDocument Drawing (Flat XML) [.fodg]
	gif      - Graphics Interchange Format [.gif]
	html     - HTML Document (OpenOffice.org Draw) [.html]
	jpg      - Joint Photographic Experts Group [.jpg]
	met      - OS/2 Metafile [.met]
	odd      - OpenDocument Drawing [.odd]
	otg      - OpenDocument Drawing Template [.otg]
	pbm      - Portable Bitmap [.pbm]
	pct      - Mac Pict [.pct]
	pdf      - Portable Document Format [.pdf]
	pgm      - Portable Graymap [.pgm]
	png      - Portable Network Graphic [.png]
	ppm      - Portable Pixelmap [.ppm]
	ras      - Sun Raster Image [.ras]
	std      - OpenOffice.org 1.0 Drawing Template [.std]
	svg      - Scalable Vector Graphics [.svg]
	svm      - StarView Metafile [.svm]
	swf      - Macromedia Flash (SWF) [.swf]
	sxd      - OpenOffice.org 1.0 Drawing [.sxd]
	sxd3     - StarDraw 3.0 [.sxd]
	sxd5     - StarDraw 5.0 [.sxd]
	sxw      - StarOffice XML (Draw) [.sxw]
	tiff     - Tagged Image File Format [.tiff]
	vor      - StarDraw 5.0 Template [.vor]
	vor3     - StarDraw 3.0 Template [.vor]
	wmf      - Windows Metafile [.wmf]
	xhtml    - XHTML [.xhtml]
	xpm      - X PixMap [.xpm]
### Presentation files

	bmp      - Windows Bitmap [.bmp]
	emf      - Enhanced Metafile [.emf]
	eps      - Encapsulated PostScript [.eps]
	fodp     - OpenDocument Presentation (Flat XML) [.fodp]
	gif      - Graphics Interchange Format [.gif]
	html     - HTML Document (OpenOffice.org Impress) [.html]
	jpg      - Joint Photographic Experts Group [.jpg]
	met      - OS/2 Metafile [.met]
	odg      - ODF Drawing (Impress) [.odg]
	odp      - ODF Presentation [.odp]
	otp      - ODF Presentation Template [.otp]
	pbm      - Portable Bitmap [.pbm]
	pct      - Mac Pict [.pct]
	pdf      - Portable Document Format [.pdf]
	pgm      - Portable Graymap [.pgm]
	png      - Portable Network Graphic [.png]
	potm     - Microsoft PowerPoint 2007/2010 XML Template [.potm]
	pot      - Microsoft PowerPoint 97/2000/XP Template [.pot]
	ppm      - Portable Pixelmap [.ppm]
	pptx     - Microsoft PowerPoint 2007/2010 XML [.pptx]
	pps      - Microsoft PowerPoint 97/2000/XP (Autoplay) [.pps]
	ppt      - Microsoft PowerPoint 97/2000/XP [.ppt]
	pwp      - PlaceWare [.pwp]
	ras      - Sun Raster Image [.ras]
	sda      - StarDraw 5.0 (OpenOffice.org Impress) [.sda]
	sdd      - StarImpress 5.0 [.sdd]
	sdd3     - StarDraw 3.0 (OpenOffice.org Impress) [.sdd]
	sdd4     - StarImpress 4.0 [.sdd]
	sxd      - OpenOffice.org 1.0 Drawing (OpenOffice.org Impress) [.sxd]
	sti      - OpenOffice.org 1.0 Presentation Template [.sti]
	svg      - Scalable Vector Graphics [.svg]
	svm      - StarView Metafile [.svm]
	swf      - Macromedia Flash (SWF) [.swf]
	sxi      - OpenOffice.org 1.0 Presentation [.sxi]
	tiff     - Tagged Image File Format [.tiff]
	uop      - Unified Office Format presentation [.uop]
	vor      - StarImpress 5.0 Template [.vor]
	vor3     - StarDraw 3.0 Template (OpenOffice.org Impress) [.vor]
	vor4     - StarImpress 4.0 Template [.vor]
	vor5     - StarDraw 5.0 Template (OpenOffice.org Impress) [.vor]
	wmf      - Windows Metafile [.wmf]
	xhtml    - XHTML [.xml]
	xpm      - X PixMap [.xpm]
### Spreadsheet files

	csv      - Text CSV [.csv]
	dbf      - dBASE [.dbf]
	dif      - Data Interchange Format [.dif]
	fods     - OpenDocument Spreadsheet (Flat XML) [.fods]
	html     - HTML Document (OpenOffice.org Calc) [.html]
	ods      - ODF Spreadsheet [.ods]
	ooxml    - Microsoft Excel 2003 XML [.xml]
	ots      - ODF Spreadsheet Template [.ots]
	pdf      - Portable Document Format [.pdf]
	pxl      - Pocket Excel [.pxl]
	sdc      - StarCalc 5.0 [.sdc]
	sdc4     - StarCalc 4.0 [.sdc]
	sdc3     - StarCalc 3.0 [.sdc]
	slk      - SYLK [.slk]
	stc      - OpenOffice.org 1.0 Spreadsheet Template [.stc]
	sxc      - OpenOffice.org 1.0 Spreadsheet [.sxc]
	uos      - Unified Office Format spreadsheet [.uos]
	vor3     - StarCalc 3.0 Template [.vor]
	vor4     - StarCalc 4.0 Template [.vor]
	vor      - StarCalc 5.0 Template [.vor]
	xhtml    - XHTML [.xhtml]
	xls      - Microsoft Excel 97/2000/XP [.xls]
	xls5     - Microsoft Excel 5.0 [.xls]
	xls95    - Microsoft Excel 95 [.xls]
	xlt      - Microsoft Excel 97/2000/XP Template [.xlt]
	xlt5     - Microsoft Excel 5.0 Template [.xlt]
	xlt95    - Microsoft Excel 95 Template [.xlt]

## Manage

	npm install @totemorg/reader	# install
	npm run start [ ? | $ | ...]	# Unit test
	npm run verminor				# Roll minor version
	npm run vermajor				# Roll major version
	npm run redoc					# Regen documentation
	
## Usage

Acquire **READER** and optionally configure:
	
	require("reader").config({
		key: value, 						// set key
		"key.key": value, 					// indexed set
		"key.key.": value					// indexed append
	}, err => {
		console.log( err ? "something evil is lurking" : "look mom - Im running!");
	});

where configuration keys follow [ENUMS deep copy conventions](https://www.npmjs.com/package/@totemorg/enums).


## Program Reference
<details>
<summary>
<i>Open/Close</i>
</summary>
<a name="module_READER"></a>

## READER
Read (index, score, parse, scrape) a variety of document, 
graphic, presentation, and spreadsheet files,  
Ingested text is checked 
for readibility, indexed to the best using NLP training rules.
Documented in accordance with [jsdoc](https://jsdoc.app/).

**Requires**: <code>module:[enums](https://www.npmjs.com/package/enums)</code>, <code>module:[geohack](https://www.npmjs.com/package/geohack)</code>, <code>module:[fs](https://nodejs.org/docs/latest/api/)</code>, <code>module:[node-xlsx](https://www.npmjs.com/package/mathjs)</code>, <code>module:[jsdom](https://www.npmjs.com/package/jsdom)</code>, <code>module:[xml2js](https://www.npmjs.com/package/xml2js)</code>, <code>module:[unoconv](https://www.npmjs.com/package/unoconv)</code>, <code>module:[htmlparser](https://www.npmjs.com/package/htmlparser)</code>, <code>module:[pdf2json](https://www.npmjs.com/package/pdf2json)</code>, <code>module:[yql](https://www.npmjs.com/package/yql)</code>, <code>module:[natural](https://www.npmjs.com/package/natural)</code>, <code>module:[teacher](https://www.npmjs.com/package/teacher)</code>, <code>module:[lda](https://www.npmjs.com/package/lda)</code>, <code>module:[shp-write](https://www.npmjs.com/package/shp-write)</code>, <code>module:[shp](https://www.npmjs.com/package/shp)</code>, <code>module:[tokml](https://www.npmjs.com/package/tokml)</code>, <code>module:[parse-kml](https://www.npmjs.com/package/parse-kml)</code>, <code>module:[teseract](https://www.npmjs.com/package/teseract)</code>  

* [READER](#module_READER)
    * [.readers](#module_READER.readers)
    * [.scanner()](#module_READER.scanner)

<a name="module_READER.readers"></a>

### READER.readers
**Kind**: static property of [<code>READER</code>](#module_READER)  
<a name="module_READER.scanner"></a>

### READER.scanner()
**Kind**: static method of [<code>READER</code>](#module_READER)  
</details>

## Contacting, Contributing, Following

Feel free to 
* submit and status [TOTEM issues](http://totem.hopto.org/issues.view) 
* contribute to [TOTEM notebooks](http://totem.hopto.org/shares/notebooks/) 
* revise [TOTEM requirements](http://totem.hopto.org/reqts.view) 
* browse [TOTEM holdings](http://totem.hopto.org/) 
* or follow [TOTEM milestones](http://totem.hopto.org/milestones.view) 


## License

[MIT](LICENSE)
											   
* * *

&copy; 2012 ACMESDS