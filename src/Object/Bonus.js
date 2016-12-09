/****************************************
 * 技能奖励类
 ****************************************/

/**
 * 奖励状态机
 * @enum {number}
 */
var BonusState =
{
	NONE: 0,
	SHOW: 1,
	SCORE: 2
};


var Bonus = Class(
{
	_sptIcon: null,					// 奖励精灵
	_state: BonusState.NONE,		// 状态机
	_type: 0,						// 0-铲子 1-五角星 2-加命 3-防弹 4-炸弹 5-定时


	_tickFlash: null,				// 图标闪烁间隔
	_statFlash: null,				// 图标闪烁状态

	_tickToggle: null,				// 总部切换间隔
	_statToggle: null,				// 总部切换状态

	_tickScore: null,				// 分数显示时间

	_timerProtect: 0,				// 总部防护时间计时
	_timerFreeze: 0,				// 定时技能计时



	Bonus: function()
	{
		//
		// 创建精灵
		//
		this._sptIcon = new Sprite("res/Tank.png", 32, 32);
		this._sptIcon.Hide();
		this._sptIcon.SetZ(Const.Z_BONUS);
		App.GameUI.Append(this._sptIcon);


		//
		// 相关定时器
		//
		this._tickFlash = new Tick(10);
		this._statFlash = new Tick(2);		// 2态计数器，在true和false间切换。

		this._tickToggle = new Tick(30);
		this._statToggle = new Tick(2);

		this._tickScore = new Tick(20);
	},


	/**
	 * 逻辑更新
	 */
	Update: function()
	{
		this._timerProtect--;
		this._timerFreeze--;

		/*
		 * 铁锹保护倒计时
		 *
		 * 在快结束前时间内，
		 * 总部围墙在 铁块 和 砖块 间切换。
		 * 即使已没有围墙，也补上
		 */
		if(0 <= this._timerProtect && this._timerProtect < 330)
		{
			// 切换定时器
			if(this._tickToggle.On())
				this._SetBaseWall(this._statToggle.On());
		}

		//
		// 更新状态机
		//
		switch(this._state)
		{
		case BonusState.NONE:	// -奖励没有出现
			break;

		case BonusState.SHOW:	// -奖励出现，等待玩家去接
			// 奖励闪烁定时器
			if(this._tickFlash.On())
				this._sptIcon.SetVisible(this._statFlash.On());

			this._CheckBonus();
			break;

		case BonusState.SCORE:	// -显示奖励分数
			if(this._tickScore.On())
				this.Clear();
			break;
		}
	},


	/**
	 * 显示奖励
	 */
	Show: function()
	{
		var rnd = Math.random;
		this._type = rnd() * 6 >> 0;

		//
		// 奖励出现在地图上可进入的位置
		//
		var c, r;
		do
		{
			c = rnd() * 24 >> 0;
			r = rnd() * 24 >> 0;
		}
		while(App.Scene.GetBlock4x4(c, r) >= Const.BLOCK_IRON)

		//
		// 显示奖励图标
		//
		this._sptIcon.SetFrame(Const.FR_BONUS + this._type);
		this._sptIcon.Move(Const.POS_X + c * 16, Const.POS_Y + r * 16);
		this._sptIcon.Show();

		this._state = BonusState.SHOW;
	},


	/**
	 * 当前是否处于定时
	 */
	IsFreezed: function()
	{
		return this._timerFreeze > 0;
	},


	/**
	 * 清空奖励
	 */
	Clear: function()
	{
		this._sptIcon.Hide();
		this._state = BonusState.NONE;
	},


	/**
	 * 重置奖励
	 */
	Reset: function()
	{
		this.Clear();

		// 复位计数器
		this._tickScore.Reset();

		this._timerFreeze = 0;
		this._timerProtect = 0;
	},



	/**
	 * 获得奖励
	 */
	_CheckBonus: function()
	{
		var i, player = App.Scene.Tanks[0];

		//
		// 玩家是否碰到奖励
		//
		if(!player.IsLive() || !player.CheckColl(this._sptIcon))
			return;

		switch(this._type)
		{
		case 0:		// 铲子
			this._timerProtect = Const.TIME_WALL_IRON;
			this._statToggle.Reset();
			this._SetBaseWall(true);
			break;

		case 1:		// 升级
			player.Upgrade();
			break;

		case 2:		// 加命
			App.Game.LifeInc();
			break;

		case 3:		// 防弹
			player.StartBulProof(Const.TIME_BULPRF_BONUS);
			break;

		case 4:		// 炸弹
			for(i = 1; i < Const.MAX_TANK; ++i)
			{
				if(App.Scene.Tanks[i].IsLive())
					App.Scene.Tanks[i].Hit(true);	//强制爆炸
			}
			break;

		case 5:		// 定时
			this._timerFreeze = 1000;
			break;
		}

		// 奖励500分
		App.Game.SocreAdd(500);

		// 取消闪烁
		this._sptIcon.Show();
		this._sptIcon.SetFrame(Const.FR_SCORE + 4);

		this._state = BonusState.SCORE;
	},


	/**
	 * 设置总部围墙
	 */
	_SetBaseWall: function(iron)
	{
		var skip = iron? 0 : 0xF;

		//-------------------x--y---tile
		App.Scene.SetMapCell(5, 11, 14 + skip);		// 上-左
		App.Scene.SetMapCell(6, 11, 18 + skip);		// 上-中
		App.Scene.SetMapCell(7, 11, 10 + skip);		// 上-右

		App.Scene.SetMapCell(5, 12, 16 + skip);		// 左
		App.Scene.SetMapCell(7, 12, 11 + skip);		// 右
	}
});
