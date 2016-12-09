/****************************************
 * 开场界面模块
 ****************************************/
var UIOpen = Class(Layer,
{
	_lalScore: null,		// 顶端分数
	_sptSel: null,			// 选择图标

	_tickSel: null,



	/**
	 * 构造函数 - 创建开场界面
	 */
	UIOpen: function()
	{
		this.Layer();		// super


		this._tickSel = new Tick(5);


		var spt, lal;

		// 分数文字
		this._lalScore = new Lable();
		this._lalScore.Move(36, 48);
		this._lalScore.SetColor("#FFF");
		this.Append(this._lalScore);

		this.DispScore();

		// LOGO
		spt = new Sprite("res/UI.png", 376, 160);
		spt.Move(56, 96);
		this.Append(spt);

		// 选择文字
		lal = new Lable();
		lal.Move(178, 272);
		lal.SetText("1  PLAYER\n2  PLAYERS\nCONSTRUCTION");
		lal.SetColor("#FFF");
		this.Append(lal);

		// 选择图标
		this._sptSel = new Sprite("res/Tank.png", 32, 32);
		this._sptSel.Move(130, 272);
		this._sptSel.SetFrameSeq([28, 42]);
		this.Append(this._sptSel);
	},


	OnEnter: function()
	{
		// 显示-开场层
		this.Show();
		this.SetY(448);

		// 滚动过程中不显示坦克图标
		this._sptSel.Hide();
	},


	OnLeave: function()
	{
		// 隐藏-开场界面
		this.Hide();
		this._sptSel.Hide();
	},


	OnUpdate: function(T)
	{
		if(T <= 224)
		{
			//
			// 按START跳过滚动画面
			//
			if(Input.IsPressed(InputAction.START))
				T = 224;

			this.SetY(448 - T * 2);
		}
		else if(T == 225)
		{
			// 显示-坦克图标
			this._sptSel.Show();
		}
		else
		{
			//
			// 坦克图标动画
			//
			if(this._tickSel.On())
				this._sptSel.NextFrame();
		}

		//
		// 按START进入游戏
		//
		if(Input.IsPressed(InputAction.START))
			return App.MyApp.Go(App.GameUI);

		return T;
	},


	DispScore: function()
	{
		//
		// "I- 当前分  HI- 最高分"
		//
		var sCur = Misc.StrN(App.Game.Score? App.Game.Score : "00", 11);

		this._lalScore.SetText("I-" + sCur + "  HI- " + App.Game.ScoreHi);
	}
});