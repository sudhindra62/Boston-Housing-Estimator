import MLR from 'ml-regression-multivariate-linear';

const x = [[0,0],[1,1],[2,2]];
const y = [[0],[1],[2]];
const mlr = new MLR(x, y);
console.log(mlr.predict([[3,3]]));
