/********************************************
 * JavaScript BattleCity v1.1
 *   By EtherDream (C) 2007-2011
 ********************************************/
var App = window["App"] = Class(
{
	Static:
	{
		//
		// 全局实例
		//
		MyApp: null,		// 主类
		Scene: null,		// 场景对象
		Game: null,			// 游戏逻辑对象

		OpenUI: null,		// 子UI界面
		GameUI: null,
		ScoreUI: null,
		OverUI: null
	},


	_curUI: null,
	_tickUI: 0,
	_oTimer: null,



	App: function()
	{
		/*
		 * Loader类位于WebPlay.js，
		 * 用来预加载图片资源。
		 * WebPlay库使用的图片必须通过此类加载。
		 *
		 * 构造器指定一个图片资源数组，
		 * 设置回调接口后开始加载。
		 *
		 * 当所有资源加载完成后，
		 * 将调用接口complete方法。
		 *
		 * 其余还有process，error方法，
		 * 详细参考WebPlay源文件。
		 */
		new Loader(["res/Tank.png", "res/Terr.png", "res/Boom.png", "res/Misc.png", "res/UI.png", "res/Frag.png"])
			.SetListener(this);
	},


	/**
	 * Loader回调接口 -- complete
	 */
	complete: function()
	{
		App.MyApp = this;
		App.Game = new Game();

		var UI =
		[
			App.OpenUI = new UIOpen(),
			App.GameUI = new UIGame(),
			App.ScoreUI = new UIScore(),
			App.OverUI = new UIOver()
		];

		this._CreateUI(UI);

		App.Scene = new Scene();

		// 进入开场界面
		this.Go(App.OpenUI);
	},


	/**
	 * 创建界面
	 */
	_CreateUI: function(UI)
	{
		var i, layWrap = new Layer();

		layWrap.SetSize(512, 448);
		layWrap.SetClass("GameScreen");
		layWrap.Attach(document.body);		// 添加到页面

		//
		// 添加所有子界面
		//
		for(i = 0; i < 4; ++i)
		{
			UI[i].Hide();
			UI[i].SetSize(512, 448);

			layWrap.Append(UI[i]);
		}
	},


	/**
	 * Timer回调接口
	 */
	OnTimer: function()
	{
		// 更新当前UI逻辑
		var t = this._curUI.OnUpdate(this._tickUI);

		if(t != -999)
			this._tickUI = t + 1;
		else
			this._tickUI = 0;
	},


	/**
	 * UI切换功能。
	 *
	 * 每个UI对象必须实现3个方法：
	 *   1.OnEnter  (进入场景)
	 *   2.OnLeave  (离开场景)
	 *   3.OnUpdate (刷新场景)
	 *
	 * 调用Go方法，进入一个指定的UI。
	 *
	 * 当进入一个UI时，
	 * 上个UI的OnLeave方法将被调用，
	 * 接着调用当前UI的OnEnter方法，
	 * 此后定时器将不断调用当前UI的OnUpdate方法。
	 *
	 * OnUpdate每次调用都传入一个参数T，
	 * 第一次从0开始依次递增。
	 * OnUpdate的返回值+1将作为下个T值。
	 * 如果返回-999（调用Go函数切换界面），
	 * T值将归零。
	 */
	Go: function(UI)
	{
		if(this._curUI)
			this._curUI.OnLeave();

		UI.OnEnter();
		this._curUI = UI;

		if(!this._oTimer)
		{
			this._oTimer = new Timer(this, 16);
			this._oTimer.Start();
		}

		return -999;
	}
});