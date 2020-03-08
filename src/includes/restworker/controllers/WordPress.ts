import RestWorker from '../RestWorker'

export interface AuthRequestObject {
	username: string
	password: string
}

export interface AuthSuccessObject {
	token: string
	user_display_name: string
	user_email: string
	user_nicename: string
}

export interface AuthRejectObject {
	code: string
	data: {
		status: number
	}
	message: string
}

export type AuthObject = AuthSuccessObject | AuthRejectObject | null

export default class WordPressWorker extends RestWorker {
	auth: AuthObject = null

	constructor(target: string) {
		super(target)
		this.checkForUser()
	}

	fetchLocalStorage(item: string) {
		if (window.localStorage) {
			return localStorage.getItem(item)
		} else return false
	}

	setLocalStorage(item: string, object: any) {
		if (window.localStorage) {
			return localStorage.setItem(item, object)
		} else return false
	}

	removeLocalStorage(item: string) {
		if (window.localStorage) {
			return localStorage.removeItem(item)
		} else return false
	}

	checkForUser() {
		let lsUser = this.fetchLocalStorage('wpUser')
		if (typeof lsUser === 'string') {
			console.log('user found in localStorage')
			let user = JSON.parse(lsUser)
			if (user.token) this.validateToken(user)
		}
	}

	async authUser(auth: AuthRequestObject, rememberMe: boolean = false) {
		if (await this.getToken(auth)) {
			if (rememberMe) this.setLocalStorage('wpUser', JSON.stringify(this.auth))
			return true
		} else return false
	}

	async getToken(auth: AuthRequestObject) {
		try {
			let res = await this.request.post('/jwt-auth/v1/token', auth)
			if (res.data.token) {
				this.auth = res.data
				return true
			} else return false
		} catch (err) {
			return false
		}
	}

	validateToken(auth: AuthSuccessObject) {
		this.request.defaults.headers.common.Authorization = `Bearer ${auth.token}`
		this.request
			.post('/jwt-auth/v1/token/validate')
			.then(() => this.setUser(auth))
			.catch((e) => {
				console.log(this.request.defaults)
				this.clearUser()
			})
	}

	setUser(auth: AuthSuccessObject) {
		this.request.get('/wp/v2/users/me').then((res) => {})
	}

	clearUser() {
		this.request.defaults.headers.Authorization = ''
		if (this.fetchLocalStorage('wpUser')) this.removeLocalStorage('wpUser')
	}

	async getMenu(slug: string | null) {
		try {
			let res = await this.request.get('/menus/v1/menus/' + slug)
			return res.data
		} catch (error) {
			console.log(error)
			return false
		}
	}
}
