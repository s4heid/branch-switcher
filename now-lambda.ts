import { toLambda } from 'probot-serverless-now'
import main from './src/index'

export default toLambda(main as any)
