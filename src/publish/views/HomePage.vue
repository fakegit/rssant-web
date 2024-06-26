<template>
    <div class="publish-home-page" :class="pageClasses">
        <div class="story-image-viewer"></div>
        <template v-if="isReady">
            <MoBackHeader :isHome="isHome" border>
                <template v-slot:title>
                    <MoDebugTool class="title" @click="onClickTitle">{{ title }}</MoDebugTool>
                </template>
                <mu-button v-if="isPageFeed || isPageStory" icon class="action-detail" @click="goFeedDetail">
                    <fa-icon size="18" icon="info-circle" />
                </mu-button>
            </MoBackHeader>
            <MoLayout grey header class="main" :style="mainStyle">
                <PubFeedList class="feed-list" :currentFeedId="currentFeedId" :isMobile="!isWide" />
                <MoBrandPlaceholder v-if="showRssantPlaceholder" />
                <PubStoryList class="story-list" v-if="feed" :currentFeedId="currentFeedId"
                    :currentOffset="currentOffset" :isMobile="!isWide" />
                <PubStoryDetail class="story-detail" v-if="story" :currentFeedId="currentFeedId"
                    :currentOffset="currentOffset" :image-viewer-container-getter="imageViewerContainerGetter" />
            </MoLayout>
        </template>

        <template v-if="isPublishDisable">
            <div class="disable-notice">
                <div class="line line1">RSS发布订阅功能未开启</div>
                <div class="line line2">如有疑问请联系网站管理员</div>
            </div>
        </template>
    </div>
</template>


<script>
import MoBackHeader from '@/components/MoBackHeader';
import MoDebugTool from '@/components/MoDebugTool';
import MoLayout from '@/components/MoLayout'
import { publishFeedStore } from '@/publish/store/feed'
import { publishStoryStore } from '@/publish/store/story'
import _ from 'lodash';
import PubStoryList from '@/publish/views/StoryList.vue';
import PubFeedList from '@/publish/views/FeedList.vue';
import PubStoryDetail from '@/publish/views/StoryDetail.vue';
import { LAYOUT } from '@/plugin/common';
import { publishConfigStore } from '@/publish/store/config';
import MoBrandPlaceholder from '@/components/MoBrandPlaceholder'

export default {
    components: {
        MoBackHeader, MoDebugTool, MoLayout, PubStoryList, PubFeedList, PubStoryDetail, MoBrandPlaceholder
    },
    data() {
        return {
            isReady: false,
        }
    },
    computed: {
        isWide() {
            return LAYOUT.isWide
        },
        isPageHome() {
            return _.isNil(this.currentFeedId) && _.isNil(this.currentOffset)
        },
        isPageFeed() {
            return !_.isNil(this.currentFeedId) && _.isNil(this.currentOffset)
        },
        isPageStory() {
            return !_.isNil(this.currentFeedId) && !_.isNil(this.currentOffset)
        },
        pageClasses() {
            return {
                'is-wide': this.isWide,
                'not-wide': !this.isWide,
                'is-page-home': this.isPageHome,
                'is-page-feed': this.isPageFeed,
                'is-page-story': this.isPageStory,
            }
        },
        mainStyle() {
            return {
                width: '100%',
                maxWidth: '100%',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                overflow: 'auto',
            }
        },
        currentFeedId() {
            let feedId = this.$route.query.feed
            if (!feedId) {
                return null
            }
            return feedId
        },
        currentOffset() {
            if (_.isNil(this.currentFeedId)) {
                return null
            }
            let offset = this.$route.query.offset
            if (_.isNil(offset)) {
                return null
            }
            return _.parseInt(offset)
        },
        isHome() {
            if (this.isWide) { return true }
            return this.isPageHome
        },
        feed() {
            if (_.isNil(this.currentFeedId)) {
                return null
            }
            return publishFeedStore.get(this.currentFeedId)
        },
        story() {
            if (_.isNil(this.currentFeedId) || _.isNil(this.currentOffset)) {
                return null
            }
            return publishStoryStore.get({
                feedId: this.currentFeedId,
                offset: this.currentOffset,
            })
        },
        isPublishDisable() {
            return publishConfigStore.isLoaded && !publishConfigStore.config.is_enable
        },
        websiteTitle() {
            return publishConfigStore.websiteTitle
        },
        feedTitle() {
            return this.feed?.title || this.currentFeedId
        },
        storyTitle() {
            let feedTitle = this.feedTitle
            let title = this.story?.title
            if (feedTitle && title) {
                return `${feedTitle} - ${title}`
            }
            return title || feedTitle
        },
        title() {
            if (this.isHome) {
                return this.websiteTitle
            }
            if (this.isPageFeed) {
                return this.feedTitle
            }
            if (this.isPageStory) {
                return this.storyTitle
            }
            return this.websiteTitle
        },
        showRssantPlaceholder() {
            return this.isWide && this.isPageHome && !this.feed && !this.story
        },
    },
    async mounted() {
        await publishConfigStore.doLoad()
        window.document.title = publishConfigStore.websiteTitle
        if (!publishConfigStore.config.is_enable) {
            return
        }
        this.isReady = true
        await publishFeedStore.doLoad()
        if (!_.isNil(this.currentFeedId) && !_.isNil(this.currentOffset)) {
            await publishStoryStore.doLoadDetail({ feedId: this.currentFeedId, offset: this.currentOffset })
        }
        if (this.isWide) {
            this.setupInitFeedAndStory()
        }
    },
    methods: {
        setupInitFeedAndStory() {
            let feedId = null
            if (_.isNil(this.currentFeedId)) {
                feedId = publishFeedStore.getFirstFeedId()
                if (!_.isNil(feedId)) {
                    this.$router.push({ query: { feed: feedId } })
                }
            }
            if (!_.isNil(feedId) && _.isNil(this.currentOffset)) {
                publishStoryStore.setInitCallback(async () => {
                    let offset = publishStoryStore.getFirstStoryOffset(feedId)
                    if (_.isNil(offset)) {
                        return
                    }
                    await publishStoryStore.doLoadDetail({ feedId, offset })
                    this.$router.push({
                        query: {
                            feed: feedId, offset: offset
                        }
                    })
                })
            }
        },
        imageViewerContainerGetter() {
            return this.$el.querySelector('.story-image-viewer')
        },
        goFeedDetail() {
            this.$router.push({
                name: 'PubFeedDetailPage',
                query: { id: this.currentFeedId },
            })
        },
        onClickTitle() {
            if (!this.isWide || this.isPageHome) {
                return
            }
            this.$router.push({ name: 'PubHomePage' })
        },
    }
}
</script>


<style lang="less" scoped>
@import '~@/styles/common';

.action-detail {
    position: relative;
    width: 32 * @pr;
    height: 32 * @pr;
    margin-left: 16 * @pr;
}

.action-detail {
    position: relative;
    right: -4 * @pr;
    color: lighten(@antTextSemi, 5%);
}

.main {

    .feed-list,
    .story-list,
    .story-detail {
        height: 100%;
        overflow-y: auto;
        position: relative;
    }
}

.is-wide .main {
    display: flex;
    flex-direction: row;
    height: 100%;

    .feed-list,
    .story-list {
        border-right: 1*@pr solid @antTextLight;
    }

    .feed-list {
        width: 300*@pr;
    }

    .story-list {
        width: 360*@pr;
    }

    .story-detail {
        flex: 1;
    }
}

.not-wide.is-page-home .main {
    .feed-list {
        width: 100%;
    }

    .story-list,
    .story-detail {
        display: none;
    }
}

.not-wide.is-page-feed .main {

    .feed-list,
    .story-detail {
        display: none;
    }

    .story-list {
        width: 100%;
    }

}

.not-wide.is-page-story .main {

    .feed-list,
    .story-list {
        display: none;
    }

    .story-detail {
        width: 100%;
    }

}

.disable-notice {
    font-size: 20*@pr;
    text-align: center;
    color: @antTextLight;
    margin-top: 120*@pr;
}
</style>