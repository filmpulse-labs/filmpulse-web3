export default [
    {
        name: 'Feed',
        path: '/',
        component: require('@/components/PageFeed').default,
    },
    {
        name: 'Markets',
        path: '/markets/:market?',
        component: require('@/components/PageMarkets').default,
    },
    {
        name: 'Accounts',
        path: '/users/:author?',
        component: require('@/components/PageAccounts').default,
    },
    {
        name: 'Validated',
        path: '/validated',
        component: require('@/components/PageValidated').default,
    },
    {
        name: 'Account',
        path: '/profile',
        component: require('@/components/PageAccount').default,
    },
    {
        name: 'PostContent',
        path: '/postContent/:postContent',
        component: require('@/components/PagePostContent').default,
    },
    {
        name: 'NotFound',
        path: '/:pathMatch(.*)*',
        component: require('@/components/PageNotFound').default,
    },
]
