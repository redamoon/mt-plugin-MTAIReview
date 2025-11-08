package Plugin::MTAIReview;

use strict;
use warnings;

# MT::Plugin::MTAIReviewパッケージを確実に読み込む
# プラグインのlibディレクトリを@INCに追加
BEGIN {
    my $plugin_dir = __FILE__;
    $plugin_dir =~ s{/Plugin/MTAIReview\.pm$}{};
    unshift @INC, $plugin_dir unless grep { $_ eq $plugin_dir } @INC;
    
    eval {
        require MT::Plugin::MTAIReview;
    };
    if ($@) {
        warn "Failed to load MT::Plugin::MTAIReview: $@";
    }
}

# MT::Plugin::MTAIReviewのメソッドを直接委譲するラッパー
sub add_ai_review_button {
    return MT::Plugin::MTAIReview::add_ai_review_button(@_);
}

sub add_ai_review_button_param {
    return MT::Plugin::MTAIReview::add_ai_review_button_param(@_);
}

sub ai_review {
    return MT::Plugin::MTAIReview::ai_review(@_);
}

1;

