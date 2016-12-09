/****************************************
 * 坦克类
 ****************************************/

/**
 * 坦克状态机
 * @enum {number}
 */
var TankState =
{
	NONE: 0,
	BIRTH: 1,
	LIVE: 2,
	BOOM: 3,
	SCORE: 4,
	RESET: 5
};



var Tank = Class(
{
	Static:
	{
		BIRTH: Misc.ARR(Const.FR_BIRTH, 0,1,2,3,2,1,0,1,2,3,2,1,0),
		BULPRF: Misc.ARR(Const.FR_BULPRF, 0, 0, 1, 1)
	},

	_state: TankState.NONE,	// 状态机
	_icon: 0,				// 坦克图标
	_wheel: 0,				// 轮子状态 (0 -> 1 -> 0)
	_type: 0,				// 类型


	_tickBirth: null,		// 生产动画计时器


	_sptTank: null,			// 坦克精灵
	_boom: null,			// 爆炸


	_timerFire: 0,			// 开火计时器
	_fireDelay: 16,			// 开火最短间隔

	_tickMove: null,		// 移动计时器


	X:0, Y:0,				// 坐标
	Speed: 0,				// 移动速度
	Dir: -1,				// 当前方向
	Team: 0,				// 队伍

	Bullets: null,			// 子弹数组
	BulMax: 0,				// 最大子弹数



	Tank: function(team)
	{
		//
		// 创建坦克精灵
		//
		this._sptTank = new Sprite("res/Tank.png", 32, 32);
		this._sptTank.Hide();
		App.GameUI.Append(this._sptTank);

		// 队伍
		this.Team = team;

		// 子弹数组
		this.Bullets = [];

		// 大的爆炸对象
		this._boom = new Boom(true);

		// 定时器
		this._tickMove = new Tick(2);
	},


	Update: function()
	{
		this._timerFire--;

		//
		// 更新发出的子弹
		//
		for(var i = 0; i < this.BulMax; ++i)
			this.Bullets[i].Update();

		//
		// 坦克状态机
		//
		switch(this._state)
		{
		/*========================================
		 * 状态: 无
		 ========================================*/
		case TankState.NONE:
			break;

		/*========================================
		 * 状态: 坦克生产过程
		 ========================================*/
		case TankState.BIRTH:
			if(!this._tickBirth.On())
				return;

			//
			// 显示坦克精灵
			//
			if(!this._sptTank.Visible)
			{
				this._sptTank.Show();
				this._sptTank.SetZ(Const.Z_TANK);
			}

			// 播放生产动画
			this._sptTank.NextFrame();

			//
			// 生产完成，进入运行状态
			//
			if(this._sptTank.GetFrame() == 0)
			{
				// 撤销生产动画的帧序列
				this._sptTank.SetFrameSeq();

				this._state = TankState.LIVE;
				this.SetType(this._type);
			}
			break;

		/*========================================
		 * 状态: 坦克生运行中
		 ========================================*/
		case TankState.LIVE:
			this._UpdateUI();
			break;

		/*========================================
		 * 状态: 坦克爆炸
		 ========================================*/
		case TankState.BOOM:
			if(this._boom.Update())
				this._Boom();
			break;

		/*========================================
		 * 状态: 显示得分
		 ========================================*/
		case TankState.SCORE:
			if(this._tickScore.On())
				this._state = TankState.RESET;
			break;

		/*========================================
		 * 状态: 销毁
		 ========================================*/
		case TankState.RESET:
			this._sptTank.Hide();	// 隐藏坦克精灵
			this._state = TankState.NONE;
			break;
		}
	},


	/**
	 * 返回坦克是否存活
	 */
	IsLive: function()
	{
		return this._state == TankState.LIVE;
	},


	/**
	 * 返回坦克对象是否空闲
	 */
	IsIdle: function()
	{
		return this._state == TankState.NONE;
	},


	/**
	 * 检测坦克精灵是否与指定的层重叠
	 */
	CheckColl: function(layer)
	{
		return this._sptTank.CollidesWith(layer);
	},


	/**
	 * 子弹击中坦克
	 */
	Hit: function(force)
	{
		var ret = this._Hit(force);

		if(HitState.HIT == ret)
		{
			//
			// 坦克开始爆炸
			//
			this._boom.Start(this.X - 16, this.Y - 16);

			this._state = TankState.BOOM;
		}

		return ret;
	},


	/**
	 * 设置坦克类型
	 */
	SetType: function(t)
	{
		this._type = t;

		if(this._state != TankState.LIVE)
			return;

		this._SetType(t);
		this._UpdateFrame();
	},


	/**
	 * 设置坐标
	 */
	SetPos: function(x, y)
	{
		// 设置坦克位置
		this._sptTank.Move(Const.POS_X + x, Const.POS_Y + y);
		this.X = x;
		this.Y = y;
	},


	/**
	 * 设置方向
	 */
	SetDir: function(val)
	{
		if(this.Dir == val)
			return;

		//
		// 转弯时调整位置，使更灵活
		//
		var fix;
		switch(this.Dir)
		{
		case 0:			// 当前处于上下方向，调整y值到最近block单元位置
		case 2:
			if(this.Y % 16)
			{
				this.Y = Math.round(this.Y / 16) * 16;
				fix = true;
			}
			break;
		case 1:			// 当前处于左右方向，调整x值到最近block单元位置
		case 3:
			if(this.X % 16)
			{
				this.X = Math.round(this.X / 16) * 16;
				fix = true;
			}
			break;
		}

		this.Dir = val;

		if(fix)
		{
			this._sptTank.Move(Const.POS_X + this.X, Const.POS_Y + this.Y);
			this._UpdateFrame();
		}
	},


	/**
	 * 发射一枚子弹
	 */
	Fire: function()
	{
		if(this._timerFire > 0)
			return;

		//
		// 找出一空闲子弹并发射
		//
		var i, bul;
		for(i = 0; i < this.BulMax; ++i)
		{
			bul = this.Bullets[i];

			if(bul.IsIdle())
			{
				bul.Shot(this.X, this.Y, this.Dir);
				this._timerFire = this._fireDelay;
				break;
			}
		}
	},


	/**
	 * 当前方向前进一步
	 */
	Go: function()
	{
		//
		// 移动间隔计时器
		//
		if(!this._tickMove.On())
			return true;

		this._tickMove.Reset(3 - this.Speed);


		var tanks = App.Scene.Tanks;
		var x = this.X;
		var y = this.Y;
		var x2, y2;

		var col = x >> 4;	// Math.floor(x / 16)
		var row = y >> 4;	// Math.floor(y / 16)
		var offset, i;
		var tank;


		// 切换轮子的状态 0->1->0
		this._wheel = +!this._wheel;
		this._UpdateFrame();


		switch(this.Dir)
		{
		/******************************
		 * 上移
		 *****************************/
		case 0:
			if(y == 0)
				return false;

			//
			// 检测上方是否有阻碍块
			//
			if(y % 16 == 0)
			{
				if(!this._MoveTest(col, row-1, col+1, row-1))
					return false;
			}

			/*
			 * 坦克与坦克的碰撞检测。
			 *
			 * 如果诞生时该位置已存在坦克，
			 * 此时可以重叠，并且可以移动，
			 * 一旦分开后就不可再重叠。
			 */
			for(i = 0; i < Const.MAX_TANK; ++i)
			{
				tank = tanks[i];
				if(tank != this && tank.IsLive())
				{
					offset = tank.Y + 32 - y;
					x2 = tank.X;

					if(0 <= offset && offset <= 6 && x2 - 32 < x && x < x2 + 32)
						return false;
				}
			}

			y -= 2;
			break;
		/******************************
		 * 右移
		 *****************************/
		case 1:
			if(x == 384)	//12*32
				return false;

			if(x % 16 == 0)
			{
				if(!this._MoveTest(col+2, row, col+2, row+1))
					return false;
			}

			for(i = 0; i < Const.MAX_TANK; ++i)
			{
				tank = tanks[i];
				if(tank != this && tank.IsLive())
				{
					offset = x + 32 - tank.X;
					y1 = tank.Y;

					if(0 <= offset && offset <= 6 && y1 - 32 < y && y < y1 + 32)
						return false;
				}
			}

			x += 2;
			break;
		/******************************
		 * 下移
		 *****************************/
		case 2:
			if(y == 384)
				return false;

			if(y % 16 == 0)
			{
				if(!this._MoveTest(col, row+2, col+1, row+2))
					return false;
			}

			for(i = 0; i < Const.MAX_TANK; ++i)
			{
				tank = tanks[i];
				if(tank != this && tank.IsLive())
				{
					offset = y + 32 - tank.Y;
					x1 = tank.X;

					if(0 <= offset && offset <= 6 && x1 - 32 < x && x < x1 + 32)
						return false;
				}
			}

			y += 2;
			break;
		/******************************
		 * 左移
		 *****************************/
		case 3:
			if(x == 0)
				return false;

			if(x % 16 == 0)
			{
				if(!this._MoveTest(col-1, row, col-1, row+1))
					return false;
			}

			for(i = 0; i < Const.MAX_TANK; ++i)
			{
				tank = tanks[i];
				if(tank != this && tank.IsLive())
				{
					offset = tank.X + 32 - x;
					y1 = tank.Y;

					if(0 <= offset && offset <= 6 && y1 - 32 < y && y < y1 + 32)
						return false;
				}
			}

			x -= 2;
			break;
		}

		this.X = x;
		this.Y = y;
		this._sptTank.Move(Const.POS_X + x, Const.POS_Y + y);

		return true;
	},


	/**
	 * 生产坦克
	 */
	Birth: function()
	{
		// 进入产生状态
		this._state = TankState.BIRTH;

		this._sptTank.SetFrameSeq(Tank.BIRTH);
	},


	/**
	 * 重置坦克对象
	 */
	Reset: function()
	{
		this._Reset();

		//
		// 复位所有子弹
		//
		for(var i = 0; i < this.BulMax; ++i)
			this.Bullets[i].Reset();

		// 复位爆炸对象
		this._boom.Reset();

		//
		// 计时器复位
		//
		this._tickMove.Reset(2);
		this._timerFire = 0;

		// 隐藏精灵
		this._sptTank.Hide();

		// 状态复位
		this._state = TankState.NONE;
	},


	/**
	 * 更新坦克界面
	 */
	_UpdateFrame: function()
	{
		this._sptTank.SetFrame(this.Dir * 28 + this._wheel * 14 + this._icon);
	},


	/**
	 * 配置子弹参数
	 */
	_SetBullets: function(max, speed, pow)
	{
		var i, bul;

		//
		// 将属性配置到每一个子弹对象
		//
		for(i = 0; i < max; ++i)
		{
			bul = this.Bullets[i];
			if(!bul)
				bul = this.Bullets[i] = new Bullet(this.Team);

			bul.Speed = speed;
			bul.Pow = pow;
		}

		this.BulMax = max;
	},


	/**
	 * 前进时地形障碍检测
	 */
	_MoveTest: function(c1, r1, c2, r2)
	{
		var B = App.Scene.Block;
		var b1 = B[r1][c1];
		var b2 = B[r2][c2];

		//
		// 只允许通过空地或雪地
		//
		return (b1 == Const.BLOCK_NONE || b1 == Const.BLOCK_ICE) &&
			   (b2 == Const.BLOCK_NONE || b2 == Const.BLOCK_ICE);
	}
});