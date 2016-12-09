var Misc = 
{
	/**
	 * 将数组的每个成员加上base值
	 *   方便帧序号的相对值计算
	 */
	ARR: function(base)
	{
		var i, n, arr = [];
		for(i=1, n=arguments.length; i<n; ++i)
			arr[i-1] = base + arguments[i];
		return arr;
	},


	StrN: function(str, len)
	{
		return ("          " + str).slice(-len);
	}
};