/*********************************************
 * WebPlay v1.0.8
 *   By EtherDream 2007-2009
 *********************************************/
var Class;
var Layer, Sprite, TiledLayer, Lable;
var Sound, Loader, Input;


/**
 * 按键常量
 * @enum {number}
 */
var InputAction =
{
	NO_REPEAT:	1e8,

	UP:		87,		//W
	DOWN:	83,		//S
	LEFT:	65,		//A
	RIGHT:	68,		//D

	GAME_A:	73,		//I
	GAME_B:	79,		//O
	GAME_C:	75,		//K
	GAME_D:	76,		//L

	START:	13,		//Enter
	SELECT:	16		//Shift
};




(function(doc){

var ver = navigator.userAgent;
var _IE_ = /MSIE/.test(ver);
var _IE6_ = /MSIE 6/.test(ver);
var _IE7_ = /MSIE 7/.test(ver) || doc.documentMode == 7;


if(_IE6_) {
	try{doc.execCommand("BackgroundImageCache", false, true)}catch(e){}
}


var run_flag = true;

function Constructor(init)
{
	return function()
	{
		if(run_flag)
			init.apply(this, arguments);
	}
}

function ToString(str)
{
	return function()
	{
		return str;
	}
}


Class = function(base, member)
{
	if(!member)
	{
		member = base;
		base = null;
	}


	var S = member.Static;
	var proto = member;
	var F, k;


	if(base)
	{
		run_flag = false;
		proto = new base;
		run_flag = true;

		for(k in member)
			proto[k] = member[k];
	}

	//
	// 约定第一个function作为构造函数
	//
	for(k in member)
	{
		if(typeof member[k] == "function")
			break;
	}

	F = Constructor(member[k]);

	proto.constructor = F;
	F.prototype = proto;
	F.toString = ToString("[class " + k + "]");

	for(k in S)
		F[k] = S[k];

	return F;
}




/*******************************************************
 * Class Layer
 *******************************************************/
Layer = Class(
{
	_div: null, _sty: null,


	Layer: function ()
	{
		this._div = doc.createElement("div");
		this._sty = this._div.style;

		this._sty.position = "absolute";
		this._sty.overflow = "hidden";
	},

	X: 0,
	SetX:
		function(v) {this._sty.left = (this.X = v) + "px"},
	Y: 0,
	SetY:
		function(v) {this._sty.top = (this.Y = v) + "px"},
	Width: 0,
	SetWidth:
			function(v) {this._sty.width = (this.Width = v) + "px"},
	Height: 0,
	SetHeight:
			function(v) {this._sty.height = (this.Height = v) + "px"},
	Z: -1,
	SetZ:
		function(v){this._sty.zIndex = v},

	SetSize:
		function(w, h)
		{
			this.SetWidth(w);
			this.SetHeight(h);
		},

	Move:
		function(x, y)
		{
			this.SetX(x);
			this.SetY(y);
		},
	MoveBy:
		function(dx, dy) {
			this.Move(this.X + dx, this.Y + dy);
		},
	Visible: true,
	SetVisible:
		_IE6_ || _IE7_?
			//
			// ie6,7 下设置display=none的子元素的display无效
			//
			function(v)
			{
				if(this.Visible != v)
				{
					this.Visible = v;
					this._sty.marginTop = v? "0" : "-9999px";
				}
			}
			:
			function(v)
			{
				if(this.Visible != v)
				{
					this.Visible = v;
					this._sty.display = v? "block" : "none";
				}
			},
	Show:
		function(){this.SetVisible(true)},
	Hide:
		function(){this.SetVisible(false)},

	SetBG:
		function(v){this._sty.background = v},
	SetClass:
		function(name){this._div.className = name},

	Append:
		function(layer)
		{
			if(layer instanceof Layer)
			{
				this._div.appendChild(layer._div)
				return this;
			}

			return Error("Argument must be a Layer type");
		},

	Attach:
		function(dom){dom.appendChild(this._div)}
});



/*******************************************************
 * Class Sprite
 *******************************************************/
Sprite = Class(Layer,
{
	_iFrCol: 0,
	_iFrNum: 0,
	_iImgW: 0,
	_iImgH: 0,

	_arrDef: null,		// 默认序列
	_arrSeqs: null,		// 序列数组

	_iSeqLen: 0,		// 序列长度 (arrSeqs.length - 1)
	_curSeq: 0,			// 序列ID
	_curFrm: 0,			// 实际帧ID (arrSeqs[序列ID] )

	_rectColl: null,




	Sprite: function(image, frameWidth, frameHeight)
	{
		this.Layer();

		this.SetImage(image, frameWidth, frameHeight);
	},


	/**************************************************
	 * SetImage
	 *   设置精灵图片及帧尺寸
	 **************************************************/
	SetImage: function(image, frameWidth, frameHeight)
	{
		var size = Loader.ImgCache[image];
		if(!size)
			throw Error("Image " + image + "not loaded");


		// 图像尺寸
		var w = this._iImgW = size.w;
		var h = this._iImgH = size.h;


		this._iFrNum = 1;
		this._arrDef = [];

		//
		// 非静态精灵
		//
		if(frameWidth != null)
		{
			// 检验尺寸是否合法
			if(w % frameWidth || h % frameHeight)
			{
				throw Error("Image " + image +
								" (" + w + "*" + h + ") size must be an integral multiple of (" +
								frameWidth + "*" + frameHeight + ")");
			}

			// 计算帧的纵横个数
			this._iFrCol = w / frameWidth;
			this._iFrNum = this._iFrCol * (h / frameHeight);

			//
			// 精灵默认帧序列
			//
			for(var i = 0; i < this._iFrNum; ++i)
				this._arrDef[i] = i;

			this._arrSeqs = this._arrDef;
			this._iSeqLen = this._iFrNum - 1;

			// 以帧的尺寸作为精灵的尺寸
			w = frameWidth;
			h = frameHeight;
		}

		this._sty.backgroundImage = "url(" + image + ")";
		this.SetSize(w, h);
	},


	/**************************************************
	 * SetFrameSeq
	 *   重新定义动画帧的播放序列。
	 *
	 *   若新的动画序帧列长度小于原先的，
	 *   播放进度重新开始。
	 *
	 *   未提供参数则恢复默认序列。
	 **************************************************/
	SetFrameSeq: function(seqs)
	{
		var l;

		if(seqs)
		{
			l = seqs.length;
			if(l <= 0)
				throw Error("Invalid frame sequence");
		}
		else
		{
			// 恢复默认序列
			seqs = this._arrDef;
			l = this._iFrNum;
		}

		if(l < this._iSeqLen + 1)
		{
			this._curSeq = 0;
			this._curFrm = seqs[0];
		}

		this._arrSeqs = seqs;
		this._iSeqLen = l - 1;

		this._UpdateImg();
	},

	/**************************************************
	 * GetFrameSeqLength
	 *   返回帧播放序列数组长度
	 **************************************************/
	GetFrameSeqLength: function()
	{
		return this._iSeqLen + 1;
	},

	/**************************************************
	 * GetRawFrameCount
	 *   返回原始帧数量
	 **************************************************/
	GetRawFrameCount: function()
	{
		return this._iFrNum;
	},

	/**************************************************
	 * SetFrame
	 *   设置当前帧序列进度
	 **************************************************/
	SetFrame: function(seqId)
	{
		this._curFrm = this._arrSeqs[seqId];

		if(this._curFrm == null)
			throw Error("Invalid frame index");

		this._curSeq = seqId;
		this._UpdateImg();
	},

	/**************************************************
	 * GetFrame
	 *   返回当前帧序列进度
	 **************************************************/
	GetFrame: function()
	{
		return this._curSeq;
	},

	/**************************************************
	 * NextFrame
	 *   显示精灵动画序列的下一帧
	 *   若当前已是最后一帧，则跳到第一帧。
	 **************************************************/
	NextFrame: function()
	{
		if(this._curSeq == this._iSeqLen)
			this._curSeq = 0;
		else
			++this._curSeq;

		this._curFrm = this._arrSeqs[this._curSeq];
		this._UpdateImg();
	},

	/**************************************************
	 * PrevFrame
	 *   显示精灵动画序列的上一帧
	 *   若当前是第一帧，则跳到最后一帧。
	 **************************************************/
	PrevFrame: function()
	{
		if(this._curSeq)
			--this._curSeq;
		else
			this._curSeq = this._iSeqLen;

		this._curFrm = this._arrSeqs[this._curSeq];
		this._UpdateImg();
	},

	/**************************************************
	 * CollidesWith
	 *   检测是否与指定的精灵发生碰撞。
	 **************************************************/
	CollidesWith: function(s)
	{
		if(!s.Visible)
			return;

		var x1, y1, w1, h1;
		var x2, y2, w2, h2;

		/*
		 * 自身精灵坐标
		 */
		var r = this._rectColl;
		if(r)
		{
			x1 = this.X + r.X;
			y1 = this.Y + r.Y;
			w1 = r.Width;
			h1 = r.Height;
		}
		else
		{
			x1 = this.X;
			y1 = this.Y;
			w1 = this.Width;
			h1 = this.Height;
		}

		/*
		 * 目标精灵
		 */
		r = s._rectColl;
		if(r)
		{
			x2 = s.X + r.X;
			y2 = s.Y + r.Y;
			w2 = r.Width;
			h2 = r.Height;
		}
		else
		{
			x2 = s.X;
			y2 = s.Y;
			w2 = s.Width;
			h2 = s.Height;
		}

		return (x1 - w2 < x2 && x2 < x1 + w1) && (y1 - h2 < y2 && y2 < y1 + h1);
	},


	/**************************************************
	 * DefCollRect
	 *   定义精灵的碰撞检测矩形。
	 *   无参数则清除检测矩形。
	 **************************************************/
	DefCollRect: function(rect)
	{
		this._rectColl = rect;
	},


	/**
	 * 更新精灵画面
	 */
	_UpdateImg: function()
	{
		if(this._iFrNum == 1)
			return;

		var col = (this._curFrm % this._iFrCol);
		var row = (this._curFrm / this._iFrCol) >> 0;

		var left = -col * this.Width;
		var top = -row * this.Height;

		this._sty.backgroundPosition = left + "px " + top + "px";
	}
});

//Sprite.__DEF_SEQ__ = {};



/*******************************************************
 * Class TiledLayer
 *******************************************************/
TiledLayer = Class(Layer,
{
	_arrTile: null,
	_arrAniTile: null,

	_iColNum: null,
	_iRowNum: null,
	
	_iTileW: null,
	_iTileH: null,



	TiledLayer: function(columns, rows, image, tileWidth, tileHeight)
	{
		this.Layer();


		this._arrTile = [];
		this._arrAniTile = [];

		this._iColNum = columns;
		this._iRowNum = rows;

		var oFrag = doc.createDocumentFragment();

		/*
		 * 创建砖块数据
		 */
		var c, r, T;

		for(r = 0; r < rows; r++)
		{
			T = this._arrTile[r] = [];

			for(c = 0; c < columns; ++c)
			{
				var oDIV = doc.createElement("div");
				var oSty = oDIV.style;

				oSty.position = "absolute";
				oSty.backgroundRepeat = "no-repeat";

				oFrag.appendChild(oDIV);

				T[c] =
				{
					id: 0,				// 砖块ID（动态砖为负数）
					staticID: 0,		// 静态ID（实际显示的序列）
					sty: oSty
				};
			}
		}

		this._div.appendChild(oFrag);
		this.SetStaticTileSet(image, tileWidth, tileHeight);
	},


	/**************************************************
	 * CreateAniTile
	 *   创建一个动态砖块，并返回砖块ID
	 *   staticTileIndex:
	 *     必须为0，或者存在的静态砖块ID
	 * 返回值从-1开始逐次递减。
	 **************************************************/
	CreateAniTile: function(staticTileIndex)
	{
		if(staticTileIndex < 0 || staticTileIndex > this._iFrNum)
			throw Error("Invalid tile index");

		var aniTile = this._arrAniTile;
		var n = aniTile.length;

		aniTile[n] =
		{
			id: staticTileIndex,
			ref: {}
		};

		return ~n;
	},

	/**************************************************
	 * SetAniTile
	 *   批量设置动态砖块图像序列
	 **************************************************/
	SetAniTile: function(aniTileIndex, staticTileIndex)
	{
		var aniTileInfo = this._arrAniTile[~aniTileIndex];
		if(!aniTileInfo)
			throw Error("Invalid animated tile index");


		if(aniTileInfo.id == staticTileIndex)
			return;
		aniTileInfo.id = staticTileIndex;


		// 
		// 枚举并修改设置了此砖块的格子
		// p = row * 1e5 + col
		//
		var p, col, row;

		for(p in aniTileInfo.ref)
		{
			if(p > 0)
			{
				col = (p % 1e5);
				row = (p / 1e5) >> 0;

				this._arrTile[row][col].staticID = staticTileIndex;
				this._DrawTileImg(col, row);
			}
		}
	},


	/**************************************************
	 * GetAniTile
	 *   返回动态砖块当前对应的图像序列
	 **************************************************/
	GetAniTile: function(aniTileIndex)
	{
		var aniTileInfo = this._arrAniTile[~aniTileIndex];
		if(!aniTileInfo)
			throw Error("Invalid animated tile index");

		return aniTileInfo.id;
	},


	/**************************************************
	 * FillCells
	 *   填充指定范围内的砖格
	 **************************************************/
	FillCells: function(col, row, numCols, numRows, tileIndex)
	{
		var r, r2 = row + numRows;
		var c, c2 = col + numCols;

		for(r = row; r < r2; ++r)
			for(c = col; c < c2; ++c)
				this.SetCell(c, r, tileIndex);
	},


	/**************************************************
	 * GetCell
	 *   返回指定砖格的砖块序列
	 **************************************************/
	GetCell: function(col, row)
	{
		return this._arrTile[row][col].id;
	},


	/**************************************************
	 * SetCell
	 *   设置指定砖格的图片序列
	 **************************************************/
	SetCell: function(col, row, tileIndex)
	{
		var tile = this._arrTile[row][col];
		var staticID = tileIndex;

		/*
		 * 之前是动态砖，取消此引用
		 */
		if(tile.id < 0)
			delete this._arrAniTile[~tile.id].ref[row*1e5 + col];

		/*
		 * 当前是动态砖，添加引用
		 */
		if(tileIndex < 0)
		{
			var aniTileInfo = this._arrAniTile[~tileIndex];

			aniTileInfo.ref[row*1e5 + col] = true;
			staticID = aniTileInfo.id;
		}

		tile.id = tileIndex;
		tile.staticID = staticID;

		this._DrawTileImg(col, row);
	},


	/**************************************************
	 * SetStaticTileSet
	 *   指定砖块层源图像
	 **************************************************/
	SetStaticTileSet: function(image, tileWidth, tileHeight)
	{
		var size = Loader.ImgCache[image];
		if(!size)
			throw Error("Image " + image + "not loaded");


		this._iImgW = size.w;
		this._iImgH = size.h;


		//
		// 检验尺寸是否合法
		//
		if(tileWidth < 1 || tileHeight < 1)
			throw Error("Invalid argument");


		if(this._iImgW % tileWidth || this._iImgH % tileHeight)
		{
			throw Error("Image: " + image +
							" (" + this._iImgW + "*" + this._iImgH + ") size must be an integral multiple of (" +
							tileWidth + "*" + tileHeight + ")");
		}

		//
		// 计算帧的纵横个数
		//
		this._iFrCol = this._iImgW / tileWidth;
		this._iFrNum = this._iFrCol * (this._iImgH / tileHeight);


		this.SetSize(this._iColNum * tileWidth, this._iRowNum * tileHeight);


		//
		// 创建地砖元素
		//
		var r, c, T;

		for(r = 0; r < this._iRowNum; ++r)
		{
			T = this._arrTile[r];

			for(c = 0; c < this._iColNum; ++c)
			{
				//
				// 更新砖块图片
				//
				var sty = T[c].sty;

				sty.backgroundImage = "url(" + image + ")";
				sty.backgroundPosition = "0 -9999px";

				sty.left = c * tileWidth + "px";
				sty.top = r * tileHeight + "px";
				sty.width = tileWidth + "px";
				sty.height = tileHeight + "px";
			}
		}

		this._iTileW = tileWidth;
		this._iTileH = tileHeight;
	},


	/**
	 * 更新砖块层图片
	 */
	_DrawTileImg: function(col, row)
	{
		var tile = this._arrTile[row][col];
		var id = tile.staticID - 1;

		var c = (id % this._iFrCol);
		var r = (id / this._iFrCol) >> 0;
		var left = -c * this._iTileW;
		var top = -r * this._iTileH;

		tile.sty.backgroundPosition = left + "px " + top + "px";
	}
});


/*******************************************************
 * Class Lable
 *******************************************************/
Lable = Class(Layer,
{
	Lable: function(text)
	{
		this.Layer();

		this._sty.font = "22px 'Arial Black'";

		if(typeof text == "string")
			this.SetText(text);
	},

	SetColor: function(color)
	{
		this._sty.color = color;
	},

	SetText: function(s)
	{
		s = s.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/\n/g, "<br/>")
				.replace(/ /g, "&nbsp;");
		this.SetHTML(s);
	},

	SetHTML: function(s)
	{
		this._div.innerHTML = s;
	},

	SetAlign: function(v)
	{
		this._sty.textAlign = v;
	},

	SetCSS: function(v)
	{
		for(var p in v)
			this._sty[p] = v[p];
	}
});


/*******************************************************
 * Class Sound
 *******************************************************/
Sound = Class(
{
	_embed: null,


	Sound: function()
	{
	},


	Play: function(music)
	{
		this.Stop();

		var obj = doc.createElement("embed");

		//obj.hidden = true;
		obj.src = music;
		obj.type = "application/x-mplayer2";
		obj.autostart = true;
		obj.style.position = "absolute";
		obj.style.top = "-9999px";

		this._embed = doc.body.appendChild(obj);
	},


	Stop: function()
	{
		if(this._embed)
		{
			doc.body.removeChild(this._embed);
			this._embed = null;
		}
	}
});



/*******************************************************
 * Class Loader
 *******************************************************/
Loader = function(arrSrc)
{
	var arrImg = [];
	var iLoaded = 0;
	var lisn;

	function handleLoad()
	{
		var src = arrSrc[this.tid];

		// 缓存当前图像尺寸数据
		Loader.ImgCache[src] = {w: this.width, h: this.height};

		++iLoaded;

		// 加载进度回调
		if(typeof lisn.process == "function")
			lisn.process(src, iLoaded, arrSrc.length);

		// 加载完成回调
		if(iLoaded == arrSrc.length &&
		   typeof lisn.complete == "function")
		{
			lisn.complete();
		}
	}

	function handleError()
	{
		if(typeof lisn.error == "function")
			lisn.error(arrSrc[this.tid], iLoaded, arrSrc.length);
	}


	/**************************************************
	 * SetListener:
	 *   设置回调接口
	 * l:
	 *   process(img_src, curID, totalID){}
	 *      载入进度
	 *   error(img_src, curID, totalID){}
	 *      载入错误
	 *   complete(){}
	 *      载入完成
	 **************************************************/
	this.SetListener = function(l)
	{
		if(!l)
			throw Error("Invalid interface");
		lisn = l;

		var i, oImg;
		for(var i = 0; i < arrSrc.length; ++i)
		{
			oImg = arrImg[i] = new Image();
			oImg.onload = handleLoad;
			oImg.onerror = handleError;
			oImg.tid = i;
			oImg.src = arrSrc[i];
		}
	}
};

Loader.ImgCache = {};


/*******************************************************
 * Singleton: Input
 *******************************************************/
Input = function()
{
	var arrRepeat = [],
		arrQuery = [],
		arrPress = [];


	for(var i=0; i<128; ++i)
	{
		arrRepeat[i] = 1;
		arrQuery[i] = -1e8;

		//
		// 默认按键延时
		//
		arrRepeat[InputAction.START] =
		arrRepeat[InputAction.SELECT] =
		arrRepeat[InputAction.GAME_C] =
		arrRepeat[InputAction.GAME_D] = InputAction.NO_REPEAT;
	}

	function handleKeyDown(e)
	{
		e = e || event;
		Input.KeyPress(e.keyCode);
	}

	function handleKeyUp(e)
	{
		e = e || event;
		Input.KeyRelease(e.keyCode);
	}

	/**
	 * 键盘事件
	 */
	if(doc.addEventListener)
	{
		doc.addEventListener("keydown", handleKeyDown, false);
		doc.addEventListener("keyup", handleKeyUp, false);
	}
	else
	{
		doc.attachEvent("onkeydown", handleKeyDown);
		doc.attachEvent("onkeyup", handleKeyUp);
	}


	return {
	/**
	 * 指定键置于按下状态
	 */
	KeyPress: function(key)
	{
		arrPress[key] = true;
	},

	/**
	 * 指定键置于提起状态
	 */
	KeyRelease: function(key)
	{
		arrPress[key] = false;
		arrQuery[key] = -1e8;
	},

	/**
	 * 指定键最短触发事件
	 */
	SetKeyRepeat: function(key, repeat)
	{
		arrRepeat[key] = repeat;
	},

	/**
	 * 检测指定的键是否按下
	 */
	IsPressed: function(key)
	{
		if(!arrPress[key])
			return false;

		var iTime = +new Date();
		if(iTime - arrQuery[key] < arrRepeat[key])
			return false;

		arrQuery[key] = iTime;
		return true;
	}
}}();



})(document);